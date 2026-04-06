const APIURL = "https://api.github.com/users/JaisonJecinthVincent";
const VERSION_URL = "version.json";
const GITHUB_TOKEN = localStorage.getItem('github_token') || '';

let user = null;
let repositories = [];
let currentDeployedVersion = null;
let r = 0;

// ---------------- VERSION WATCH ----------------
async function watchDeploymentVersion() {
    try {
        const response = await fetch(`${VERSION_URL}?ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;

        const metadata = await response.json();
        if (!metadata?.version) return;

        if (currentDeployedVersion === null) {
            currentDeployedVersion = metadata.version;
            return;
        }

        if (currentDeployedVersion !== metadata.version) {
            window.location.reload();
        }
    } catch {}
}

watchDeploymentVersion();
setInterval(watchDeploymentVersion, 15000);

// ---------------- GITHUB DATA ----------------
async function GithubData() {
    try {
        const fetchOptions = GITHUB_TOKEN
            ? { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
            : {};

        const resp = await fetch(APIURL, fetchOptions);
        const respData = await resp.json();

        if (!resp.ok) throw new Error(respData.message);

        const repos = await fetch(APIURL + "/repos", fetchOptions);
        const reposData = await repos.json();

        user = respData;
        repositories = Array.isArray(reposData) ? reposData : [];
    } catch (error) {
        console.error(error);
        user = null;
        repositories = [];
    }
}
GithubData();

// ---------------- TERMINAL ----------------
const textArea = document.getElementById('textArea');
const main = document.getElementById('main');

main.innerHTML = "Last login: Thursday May 20 13:27:02 on console";

document.body.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        const rawAction = textArea.value.trim();
        const normalizedAction = rawAction.toLowerCase();

        textArea.value = '';
        exec(rawAction, normalizedAction);

        main.scrollTop = main.scrollHeight;
    }
});

// ---------------- COMMAND EXEC ----------------
function exec(rawAction, normalizedAction) {
    let element = document.createElement('div');
    element.innerHTML = `User:~ Web-Terminal$ ${rawAction}<br>`;
    main.appendChild(element);

    // -------- ECHO --------
    if (normalizedAction.startsWith('echo ')) {
        const echo = document.createElement('div');
        echo.innerText = rawAction.slice(5);
        main.appendChild(echo);
        return;
    }

    switch (normalizedAction) {

        case "clear":
            main.innerHTML = '';
            return;

        case "whoami":
            appendText(user?.login || 'guest');
            return;

        case "projects":
            showProjects();
            return;

        case "profile":
            showProfile();
            return;

        case "help":
            showHelp();
            return;

        default:
            appendText(`'${rawAction}' is not recognized`);
    }
}

// ---------------- HELP ----------------
function showHelp() {
    const help = document.createElement("div");
    help.innerHTML = `
        CLEAR<br>
        WHOAMI<br>
        PROJECTS<br>
        PROFILE<br>
        HELP<br>
        WELP<br>
        DIR
    `;
    main.appendChild(help);
}

// ---------------- PROJECTS ----------------
function showProjects() {
    const container = document.createElement("div");

    if (!repositories.length) {
        container.innerText = "No repositories available.";
        main.appendChild(container);
        return;
    }

    repositories.slice(0, 10).forEach(repo => {
        const a = document.createElement("a");
        a.href = repo.html_url;
        a.target = "_blank";
        a.innerText = repo.name;
        container.appendChild(a);
        container.appendChild(document.createElement("br"));
    });

    main.appendChild(container);
}

// ---------------- PROFILE ----------------
function showProfile() {
    if (!user) {
        appendText("Profile not loaded yet.");
        return;
    }

    const div = document.createElement("div");
    div.innerHTML = `
        <img src="${user.avatar_url}" width="80"/>
        <h3>${user.name || ''}</h3>
        <p>${user.bio || ''}</p>
    `;
    main.appendChild(div);
}

// ---------------- UTILITY ----------------
function appendText(text) {
    const div = document.createElement("div");
    div.innerText = text;
    main.appendChild(div);
}