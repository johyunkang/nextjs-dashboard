'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const INVOICE_URL = '/dashboard/invoices'
const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, {message: 'Please enter an amount greater than $0.'}),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice( prevState: State, formData: FormData) {
    const validateFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validateFields.success){
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Filled to Create Invoice.',
        };
    }

    const { customerId, amount, status } = validateFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
        console.log('>>> customer_id', customerId, ', amount:', amountInCents, ', status:', status);
    } catch (error) {
        console.error('[ERROR] create invoice error: ', error);
        return {
            message: 'Database error: Failed to Create Invoice.',
        };
    }

    revalidatePath(INVOICE_URL);
    redirect(INVOICE_URL)
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
    id: string, 
    prevState: State,
    formData: FormData
) {
    const validateFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if(!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    const {customerId, amount, status } = validateFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
        console.log('>>> update invoice: customer_id: ', customerId);
    } catch (error) {
        console.error('[ERROR] update invoice error: ', error);
        return {
            message: 'Database Error: Failed to Update Invoice.'
        };
    }

    revalidatePath(INVOICE_URL);
    redirect(INVOICE_URL);
}

export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice');

    await sql`
        DELETE FROM invoices WHERE id = ${id}
    `;
    revalidatePath(INVOICE_URL);
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if( error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}