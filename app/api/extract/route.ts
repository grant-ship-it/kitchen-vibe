import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Define the shape of our browser/page objects roughly to satisfy TS if needed, 
// or just use 'any' for simplicity in this hybrid file.
let chromium: any;
let puppeteerCore: any;
let puppeteerStandard: any;

// We use dynamic imports to avoid bundling the wrong one in the wrong environment
// or to ensure we can handle the different launch configs.

export async function POST(request: Request) {
    let browser = null;
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
        }

        // Determine environment and launch params
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

        if (isProduction) {
            // Vercel / Production: Use puppeteer-core + @sparticuz/chromium
            if (!chromium) {
                chromium = (await import('@sparticuz/chromium-min')).default;
            }
            if (!puppeteerCore) {
                puppeteerCore = (await import('puppeteer-core')).default;
            }

            console.log('Starting puppeteer-core launch with chromium-min...');

            const remoteExecutablePath = await chromium.executablePath(
                'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            );
            console.log('Chromium executable path (remote):', remoteExecutablePath);

            browser = await puppeteerCore.launch({
                args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
                defaultViewport: chromium.defaultViewport,
                executablePath: remoteExecutablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
            console.log('Browser launched successfully');

        } else {
            // Local: Use standard puppeteer (full Chrome)
            if (!puppeteerStandard) {
                puppeteerStandard = (await import('puppeteer')).default;
            }

            browser = await puppeteerStandard.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        const page = await browser.newPage();

        // Set a consistent viewport and user agent
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Go to URL
        // Increase timeout for serverless cold starts or slow sites
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Get the HTML content
        const html = await page.content();

        const $ = cheerio.load(html);
        let recipeData: any = null;

        // 1. Try to find JSON-LD Schema
        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const content = $(element).html();
                if (content) {
                    const json = JSON.parse(content);

                    const findRecipe = (data: any): any => {
                        if (Array.isArray(data)) {
                            return data.find((item) => findRecipe(item));
                        }
                        if (data?.['@type'] === 'Recipe' || (Array.isArray(data?.['@type']) && data['@type'].includes('Recipe'))) {
                            return data;
                        }
                        if (data?.['@graph']) {
                            return findRecipe(data['@graph']);
                        }
                        return null;
                    };

                    const found = findRecipe(json);
                    if (found) {
                        recipeData = found;
                        return false;
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON-LD:', e);
            }
        });

        if (recipeData) {
            const cleanRecipe = {
                title: recipeData.name,
                image: recipeData.image?.url || recipeData.image,
                ingredients: recipeData.recipeIngredient,
                instructions: recipeData.recipeInstructions,
                description: recipeData.description,
                cookTime: recipeData.cookTime,
                prepTime: recipeData.prepTime,
                yield: recipeData.recipeYield,
            };

            if (Array.isArray(cleanRecipe.instructions)) {
                cleanRecipe.instructions = cleanRecipe.instructions.map((step: any) => {
                    if (typeof step === 'string') return step;
                    if (step['@type'] === 'HowToStep') return step.text;
                    if (step.text) return step.text;
                    return JSON.stringify(step);
                }).flat();
            }

            return NextResponse.json({ success: true, recipe: cleanRecipe });
        }

        return NextResponse.json({ error: 'Could not extract recipe data.' }, { status: 422 });

    } catch (error: any) {
        console.error('Extraction error:', error);
        return NextResponse.json({ error: 'Failed to fetch the URL', details: error.message, stack: error.stack }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
