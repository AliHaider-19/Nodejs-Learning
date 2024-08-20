const messageform = document.querySelector(".chatbox form");
const messageList = document.querySelector("#messagelist");
const userList = document.querySelector("#users");
const chatboxInput = document.querySelector(".chatbox input");
const socket = io();

let users = [];
let messages = [];
let isUser = "";

socket.on("message", message => {
    messages.push(message);
    updateMessages();
});

socket.on("private", data => {
    isUser = data.name;
});

socket.on("users", (_users) => {
    users = _users;
    updateUsers();
});

messageform.addEventListener("submit", messageSubmitHandler);

function updateUsers() {
    userList.textContent = "";
    users.forEach(user => {
        const li = document.createElement('li')
        li.textContent = user;
        userList.appendChild(li)
    })

}

function updateMessages() {
    messageList.textContent = "";
    messages.forEach(message => {
        const show = isUser = message.user;
        const li = document.createElement('li');
        li.className = show ? "private" : "";
        li.innerHTML = `<p>${message.user}</p><p>${message.message}</p>`;
        messageList.appendChild(li)

    })
}

function messageSubmitHandler(e) {
    e.preventDefault();
    const message = chatboxInput.value;
    if (message.trim() !== "") {
        socket.emit("message", message);
        chatboxInput.value = "";
    }
}

function userAddHandler(user) {
    userName = user || `User${Math.floor(Math.random() * 1000000)}`;
    socket.emit("adduser", userName);
}
const user = prompt('Enter You Name')

userAddHandler(user);