const {default: makeWASocket, DisconnectReason, useSingleFileAuthState} = require('@adiwajshing/baileys')
const {Boom} = require('@hapi/boom')
const { state, saveState} = useSingleFileAuthState('./login.json')

// chat gpt import

const { Configuration, OpenAIApi } = require("openai");
const { generate } = require('qrcode-terminal');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
//Fungsi OpenAI ChatGPT untuk Mendapatkan Respon
async function generateResponse(text) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: text,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
    });
    return response.data.choices[0].text;
}

//asyc function

async function connectToWhatsApp(){
    //make qr wa
    const sock = makeWASocket({
        auth : state,
        printQRInTerminal : true,
        defaultQueryTimeoutMs: undefined       
    })

    //listen connect updated
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect} = update
        if (connection === "close"){
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Terputusnya sambungan seperti dia : ',lastDisconnect.error,' Reconnecting',shouldReconnect)
            if(shouldReconnect){
                connectToWhatsApp()
            }
        }else if( connection === 'open'){
            console.log('koneksi tersambung')
        }
    })

    sock.ev.on("creds.update",saveState)

    //fungsi penangkap pesan

    sock.ev.on("messages.upsert",async({ messages, type}) => {
        console.log('tipe : ',type)
        console.log(messages)
        if(type === "notify"){
            try{
                 const senderNumber = messages[0].key.remoteJid

                 //dapatkan pesan
                 let incomingMessages  = messages[0].message.conversation
                 if (incomingMessages === "") {
                    incomingMessages = messages[0].message.extendedTextMessage.text;
                }
                const isMessageFromGroup = senderNumber.includes('@g.us')
                const isMessageMentionBoot = incomingMessages.includes("@6281977330481")

                incomingMessages =  incomingMessages.toLowerCase()
                 console.log("nomor : ", senderNumber)
                 console.log('IsI : ', incomingMessages)
                
                 //if send
                   if(isMessageFromGroup && isMessageMentionBoot && !incomingMessages.includes('/menu')){
                       async function main(){
                        const result = await generateResponse(incomingMessages)
                        console.log(result)
                        await sock.sendMessage(
                            senderNumber,
                            {text: result + '\n\n _YohanesOktanio | bot_'},
                            {quoted: messages[0]},
                            2000
                        )
                       }  
                       main()
                    }
                    if(isMessageMentionBoot && incomingMessages.includes('/menu')){
                        await sock.sendMessage(
                            senderNumber,
                            {text: "*Yohanes Oktanio BOT*\n ~ mention saya dan tanya apapun untuk activasi chat gpt \n _sekian terimakasih_ "},
                            {quoted: messages[0]},
                            2000
                        )
                    }


            }
            catch(error){
                console.log('error : ', error)
            }
        }
    })
}

connectToWhatsApp().catch((err)=>{
    console.log("Eneng Error : " + err)
})