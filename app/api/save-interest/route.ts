import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, recipeTitle } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'Kitchen Vibe <onboarding@resend.dev>',
            to: ['grant@icrs-pos.com'],
            subject: 'New Recipe Save Interest!',
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">New Interest recorded!</h2>
          <p>A user wants to save a recipe.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>User Email:</strong> ${email}</p>
          <p><strong>Recipe:</strong> ${recipeTitle || 'Unknown'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Sent via Kitchen Vibe PMF Engine</p>
        </div>
      `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Save interest error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
