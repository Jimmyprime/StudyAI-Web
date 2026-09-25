const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir que la página web se comunique con el servidor
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// Permitir recibir JSON
app.use(express.json());

// Página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Archivo CSS
app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "style.css"));
});

// Archivo JavaScript
app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "script.js"));
});

// Ruta de prueba
app.get("/api/test", (req, res) => {
    res.json({
        message: "El servidor de StudyAI funciona correctamente."
    });
});

    // Generar material de estudio con IA
app.post("/api/generate", async (req, res) => {

    const { subject, topic, materialType } = req.body;

    if (!subject || !topic) {
        return res.status(400).json({
            error: "Falta la materia o el tema."
        });
    }

    // Si por algún motivo no llega el tipo,
    // se utilizará "guia" automáticamente.
    const type = materialType || "guia";

    // Instrucciones diferentes para cada tipo de material
    const instructionsByType = {

        guia: `
Crea una guía de estudio completa sobre el tema.

Organízala de esta forma:

📚 GUÍA DE ESTUDIO

📖 EXPLICACIÓN
Explica el tema de manera sencilla y clara.

🧠 CONCEPTOS IMPORTANTES
Incluye los conceptos principales que el estudiante debe recordar.

✏️ EJEMPLO
Incluye al menos un ejemplo explicado paso a paso.

📝 EJERCICIOS
Crea 3 ejercicios para practicar.

✅ RESPUESTAS
Incluye las respuestas de los ejercicios.
        `,

        resumen: `
Crea un resumen claro y fácil de estudiar sobre el tema.

Organízalo de esta forma:

📖 RESUMEN

🎯 IDEA PRINCIPAL
Explica brevemente de qué trata el tema.

🧠 PUNTOS IMPORTANTES
Resume las ideas y conceptos más importantes.

⚡ REPASO RÁPIDO
Termina con una lista corta de lo que el estudiante debe recordar.

No incluyas ejercicios.
        `,

        ejercicios: `
Crea material enfocado principalmente en practicar el tema.

Organízalo de esta forma:

✏️ PRÁCTICA DE EJERCICIOS

📖 RECORDATORIO
Da una explicación muy breve de lo necesario para resolver los ejercicios.

🟢 NIVEL FÁCIL
Crea 2 ejercicios sencillos.

🟡 NIVEL INTERMEDIO
Crea 2 ejercicios de dificultad intermedia.

🔴 NIVEL DIFÍCIL
Crea 2 ejercicios más desafiantes.

✅ SOLUCIONES
Incluye las respuestas y explica brevemente cómo llegar a ellas.
        `,

        prueba: `
Crea una prueba para que el estudiante pueda evaluar lo que sabe.

Organízala de esta forma:

📝 PRUEBA DE ESTUDIO

📌 INSTRUCCIONES
Explica brevemente cómo responder.

❓ PREGUNTAS
Crea aproximadamente 8 preguntas.

Cuando sea apropiado para el tema, combina:
- selección múltiple
- verdadero o falso
- preguntas de desarrollo
- ejercicios de aplicación

No muestres la respuesta inmediatamente después de cada pregunta.

✅ RESPUESTAS
Coloca todas las respuestas al final.
        `,

        flashcards: `
Crea 10 flashcards útiles para memorizar y comprender el tema.

Organízalas de esta forma:

🃏 FLASHCARDS

Tarjeta 1
Pregunta: ...
Respuesta: ...

Tarjeta 2
Pregunta: ...
Respuesta: ...

Continúa de la misma manera hasta completar 10 tarjetas.

Las preguntas deben cubrir los conceptos más importantes del tema.
        `,

        "paso-a-paso": `
Explica el tema paso a paso para un estudiante que todavía no lo domina.

Organízalo de esta forma:

🔍 EXPLICACIÓN PASO A PASO

🎯 ¿QUÉ VAMOS A APRENDER?
Explica brevemente el objetivo.

1️⃣ PASO 1
Explica el primer paso de forma sencilla.

Continúa con los pasos necesarios para comprender el tema.

✏️ EJEMPLO PASO A PASO
Desarrolla al menos un ejemplo mostrando claramente cada paso.

🧠 PARA RECORDAR
Termina con un pequeño repaso de los pasos y conceptos más importantes.
        `
    };

    // Elegir las instrucciones correspondientes
    const typeInstruction =
        instructionsByType[type] || instructionsByType.guia;

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
    {
        role: "system",
        content: `
Eres StudyAI, un asistente educativo para estudiantes.

Tu trabajo es crear material educativo correcto, claro, ordenado y fácil de entender.

Responde siempre en español.

Adapta tus explicaciones a estudiantes y evita usar lenguaje innecesariamente complicado.

Respeta el tipo de material solicitado.

IMPORTANTE SOBRE MATEMÁTICAS:
No uses LaTeX.
No uses comandos como \\frac, \\cdot, \\times ni otros comandos de LaTeX.
No escribas operaciones entre \\( \\) ni entre \\[ \\].
Escribe las operaciones matemáticas como texto normal y fácil de leer.

Ejemplos correctos:
3x + 5 = 20
x = 15 / 3
x² + 3 = 7
2(x + 4) = 12

No escribas fórmulas como código ni uses barras invertidas en las operaciones.

${typeInstruction}
        `
    },

    {
        role: "user",
        content: `Materia: ${subject}
Tema: ${topic}
Tipo de material: ${type}`
    }
]
                })
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "Error de OpenRouter:",
                response.status,
                errorText
            );

            throw new Error(
                "La inteligencia artificial no pudo responder."
            );
        }

        const data = await response.json();

        const material =
            data.choices?.[0]?.message?.content;

        if (!material) {
            throw new Error(
                "La IA no devolvió contenido."
            );
        }

        res.json({
            text: material
        });

    } catch (error) {

        console.error(
            "Error generando material:",
            error
        );

        res.status(500).json({
            error: "No se pudo generar el material."
        });
    }

});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyAI está funcionando en el puerto ${PORT}`);
});