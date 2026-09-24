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

    const { subject, topic } = req.body;

    if (!subject || !topic) {
        return res.status(400).json({
            error: "Falta la materia o el tema."
        });
    }

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

Tu trabajo es crear material de estudio claro, correcto y fácil de entender.

Responde siempre en español.

Organiza el material exactamente con estas secciones:

📚 MATERIAL DE ESTUDIO — STUDYAI

📖 EXPLICACIÓN
Explica el tema de manera sencilla.

🧠 CONCEPTOS IMPORTANTES
Incluye los conceptos que el estudiante debe recordar.

✏️ EJEMPLO
Incluye al menos un ejemplo explicado paso a paso.

📝 EJERCICIOS
Crea 3 ejercicios para practicar.

✅ RESPUESTAS
Incluye las respuestas de los ejercicios.

No hagas explicaciones innecesariamente complicadas.
                            `
                        },

                        {
                            role: "user",
                            content: `Materia: ${subject}
Tema: ${topic}`
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