async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  input.value = "";

  try {
    const response = await fetch("http://127.0.0.1:8080/ask", {   // <-- use 8080
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message })
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    chatbox.innerHTML += `<p><b>Bot:</b> ${data.answer}</p>`;
  } catch (error) {
    chatbox.innerHTML += `<p><b>Bot:</b> Sorry, I couldn't reach the server.</p>`;
    console.error("Error:", error);
  }

  chatbox.scrollTop = chatbox.scrollHeight;
}
