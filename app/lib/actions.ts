'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const INVOICE_URL = '/dashboard/invoices'
const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
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
    }

    revalidatePath(INVOICE_URL);
    redirect(INVOICE_URL)
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

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
    }

    revalidatePath(INVOICE_URL);
    redirect(INVOICE_URL);
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    
    await sql`
        DELETE FROM invoices WHERE id = ${id}
    `;
    revalidatePath(INVOICE_URL);
}