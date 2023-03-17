const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const response = await openai.createCompletion({
  model: "code-davinci-003",
  prompt: "Apa itu dunia",
  temperature: 0.3,
  max_tokens: 3000,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
});

console.log(response)