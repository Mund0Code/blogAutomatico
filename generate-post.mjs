import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { createApi } from 'unsplash-js';

// --- CONFIGURACIÓN DE APIS ---
// El script tomará las claves de las variables de entorno
// que configuraste en los secretos de GitHub.

// Configuración de la API de Groq para texto
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Configuración de la API de Unsplash para imágenes
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});


// --- FUNCIÓN PRINCIPAL ---
async function main() {
    console.log('🤖 Iniciando la generación de un nuevo post...');

    // 1. Generar un título para el artículo
    const topicPrompt = "Genera un título atractivo y corto para un artículo de blog sobre un tema de actualidad en tecnología o programación. Por ejemplo: 'Novedades de JavaScript en 2025' o 'Introducción a la computación cuántica'. Dame solo el título, sin comillas ni texto adicional.";
    const topicResponse = await groq.chat.completions.create({
        messages: [{ role: 'user', content: topicPrompt }],
        model: 'llama3-8b-8192',
    });
    const title = topicResponse.choices[0]?.message?.content.trim();

    if (!title) {
        console.error('Error: No se pudo generar un título.');
        return process.exit(1); // Termina el script con un código de error
    }
    console.log(`✨ Título generado: ${title}`);

    // 2. Generar el contenido del artículo
    const contentPrompt = `Escribe un artículo de blog completo en español sobre el tema: "${title}". El artículo debe tener una introducción, varios párrafos de desarrollo y una conclusión. Utiliza formato Markdown. Incluye encabezados (##) para las secciones y usa negritas para términos importantes. El tono debe ser informativo y accesible.`;
    const contentResponse = await groq.chat.completions.create({
        messages: [{ role: 'user', content: contentPrompt }],
        model: 'llama3-70b-8192', // Usamos un modelo más potente para el contenido
    });
    const content = contentResponse.choices[0]?.message?.content.trim();

    if (!content) {
        console.error('Error: No se pudo generar el contenido.');
        return process.exit(1);
    }
    console.log('✅ Contenido del artículo generado.');

    // 3. Buscar una imagen en Unsplash
    let imageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475'; // URL de fallback por si falla la búsqueda
    try {
        console.log(`🖼️  Buscando imagen para: "${title}"`);
        const imageResult = await unsplash.search.getPhotos({
            query: title,
            page: 1,
            perPage: 1,
            orientation: 'landscape',
        });

        if (imageResult.response && imageResult.response.results.length > 0) {
            imageUrl = imageResult.response.results[0].urls.regular;
            console.log(`✅ Imagen encontrada: ${imageUrl}`);
        } else {
            console.log('⚠️ No se encontró una imagen, se usará una por defecto.');
        }
    } catch (error) {
        console.error('Error al buscar la imagen en Unsplash:', error.message);
        console.log('Usando imagen por defecto debido al error.');
    }

    // 4. Crear el archivo del post en formato Markdown
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const filePath = path.join('src/content/blog', `${slug}.md`);

    // El frontmatter ahora incluye el campo 'heroImage'
    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
pubDate: ${date}
description: "Un resumen del artículo sobre ${title.replace(/"/g, '\\"')}"
author: "Blog Automatizado"
heroImage: "${imageUrl}"
tags: ["tecnología", "programación", "ia"]
---

${content}
`;

    fs.writeFileSync(filePath, fileContent);
    console.log(`💾 ¡Éxito! Nuevo post guardado en: ${filePath}`);
}

// --- EJECUCIÓN DEL SCRIPT ---
main().catch(error => {
    console.error('Ocurrió un error inesperado en la ejecución:', error);
    process.exit(1); // Termina el script con un código de error
});
