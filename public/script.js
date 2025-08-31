// const form = document.getElementById('chat-form');
// const input = document.getElementById('user-input');
// const chatBox = document.getElementById('chat-box');

// form.addEventListener('submit', function (e) {
//   e.preventDefault();

//   const userMessage = input.value.trim();
//   if (!userMessage) return;

//   appendMessage('user', userMessage);
//   input.value = '';

//   // Simulasi dummy balasan bot (placeholder)
//   setTimeout(() => {
//     appendMessage('bot', 'Gemini is thinking... (this is dummy response)');
//   }, 1000);
// });

// function appendMessage(sender, text) {
//   const msg = document.createElement('div');
//   msg.classList.add('message', sender);
//   msg.textContent = text;
//   chatBox.appendChild(msg);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
/**
 * Appends a new message to the chat box.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} text - The message content.
 * @returns {HTMLElement} The created message element.
 */
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgDiv;
}
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;
  // 1. Add the user's message to the chat box.
  appendMessage('user', userMessage);
  input.value = '';
  // 2. Show a temporary "Thinking..." bot message and keep a reference to it.
  const thinkingMessageElement = appendMessage('bot', 'Gemini is thinking...');
  try {
    // 3. Send the user's message to the backend API.
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Your backend expects a 'message' property which is an array.
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();
    // 4. When the response arrives, replace the "Thinking..." message.
    if (data.result) {
      thinkingMessageElement.textContent = data.result;
    } else {
      thinkingMessageElement.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Failed to get response:', error);
    thinkingMessageElement.textContent = 'Failed to get response from server.';
  } finally {
    // Ensure the view is scrolled to the bottom after the final message is rendered.
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

