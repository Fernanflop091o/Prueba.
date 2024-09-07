const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Configura el bot de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuración de la API de Google Custom Search
const googleApiKey = 'AIzaSyDIrZO_rzRxvf9YvbZK1yPdsj4nrc0nqwY'; // Tu clave de API
const searchEngineId = '670a0903b1cf8403b'; // Tu ID de motor de búsqueda

// Configuración de la API de YouTube
const youtubeApiKey = 'AIzaSyDIrZO_rzRxvf9YvbZK1yPdsj4nrc0nqwY'; // Tu clave de API de YouTube

const messages = {
    es: {
        title: 'Aquí está lo que encontré:',
        noImages: 'No se encontraron imágenes.',
        noVideos: 'No se encontraron videos.',
        visitPage: 'Visitar página',
        provideQuery: 'Por favor, proporciona un término de búsqueda.',
        videoTitle: 'Título del video:',
        videoDescription: 'Descripción del video:'
    }
};

// Función para obtener el idioma preferido del servidor (si fuera necesario, pero aquí no lo usamos)
function getLanguage() {
    return 'es'; // Siempre devuelve español
}

async function searchGoogle(query) {
    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: googleApiKey,
                cx: searchEngineId,
                q: query,
                searchType: 'image',
                num: 1
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al buscar en Google:', error.message);
        return null;
    }
}

async function searchYouTube(query) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: youtubeApiKey,
                q: query,
                part: 'snippet',
                type: 'video',
                maxResults: 1
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al buscar en YouTube:', error.message);
        return null;
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const command = message.content.trim().split(' ')[0].toLowerCase();
    const query = message.content.slice(command.length).trim();
    const lang = getLanguage(); // Siempre en español
    const msgs = messages[lang];

    try {
        if (command === '.img') {
            if (query) {
                const result = await searchGoogle(query);

                if (result) {
                    const embed = new EmbedBuilder()
                        .setTitle(msgs.title)
                        .setDescription(`[${msgs.visitPage}](${result.image.contextLink})`)
                        .setImage(result.link);

                    await message.channel.send({ embeds: [embed] });
                } else {
                    await message.channel.send(msgs.noImages);
                }
            } else {
                await message.channel.send(msgs.provideQuery);
            }
        } else if (command === '.vid') {
            if (query) {
                const videoResult = await searchYouTube(query);

                if (videoResult) {
                    const embed = new EmbedBuilder()
                        .setTitle(msgs.videoTitle)
                        .setDescription(`${msgs.videoDescription}\n[${videoResult.snippet.title}](${`https://www.youtube.com/watch?v=${videoResult.id.videoId}`})`)
                        .setThumbnail(videoResult.snippet.thumbnails.high.url);

                    await message.channel.send({ embeds: [embed] });
                } else {
                    await message.channel.send(msgs.noVideos);
                }
            } else {
                await message.channel.send(msgs.provideQuery);
            }
        }
    } catch (error) {
        console.error('Error al manejar el mensaje:', error.message);
        await message.channel.send('Ocurrió un error al procesar tu solicitud.');
    }
});

// Manejador global de errores no capturados
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login del bot usando el token desde las variables de entorno
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Error al iniciar sesión:', error);
});
