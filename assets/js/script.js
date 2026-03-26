const APIURL = "https://api.github.com/users/github";
const VERSION_URL = "version.json";

let user;
let repositories;

let currentDeployedVersion = null;

async function watchDeploymentVersion() {
    try {
        const response = await fetch(`${VERSION_URL}?ts=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            return;
        }

        const metadata = await response.json();
        if (!metadata || !metadata.version) {
            return;
        }

        if (currentDeployedVersion === null) {
            currentDeployedVersion = metadata.version;
            return;
        }

        if (currentDeployedVersion !== metadata.version) {
            window.location.reload();
        }
    } catch (error) {
        // Ignore polling errors to keep terminal interactions unaffected.
    }
}

watchDeploymentVersion();
setInterval(watchDeploymentVersion, 15000);

const GithubData = async ()=>{
    const resp = await fetch(APIURL);
    const respData = await resp.json();

    const repos = await fetch(APIURL+"/repos");
    const reposData = await repos.json();

    user = respData;
    repositories = reposData;
};GithubData();

const textArea = document.getElementById('textArea');
const main = document.getElementById('main');
let respData;

main.innerHTML = "Last login: Thursday May 20 13:27:02 on console";
document.body.addEventListener('keypress', e => {
    const keyName = e.key;
    if(keyName == 'Enter'){
        e.preventDefault();
        const text = textArea.value;
        exec(text);
        textArea.value = '';
        main.scrollTop = main.scrollHeight;
    }
  });

let r=0;
function exec(action){
    const rawAction = action || '';
    const normalizedAction = rawAction.trim().toLowerCase();

    let element = document.createElement('div');
    element.innerHTML = "User:~ Web-Terminal$ "+rawAction+"<br>";
    main.appendChild(element);
    if(normalizedAction.startsWith('echo ')){
        const echoText = rawAction.slice(rawAction.toLowerCase().indexOf('echo ') + 5);
        const echo = document.createElement('div');
        echo.innerText = echoText;
        main.appendChild(echo);
        return;
    }

    if(normalizedAction === 'echo'){
        const echo = document.createElement('div');
        echo.innerText = '';
        main.appendChild(echo);
        return;
    }

    if(normalizedAction.startsWith('cat ')){
        const fileName = rawAction.slice(rawAction.toLowerCase().indexOf('cat ') + 4).trim().toLowerCase();
        const cat = document.createElement('div');

        if(fileName === 'readme.md' || fileName === 'readme'){
            cat.innerHTML = `
                INFO-WITH-WEB-TERMINAL<br/>
                Static portfolio-like web terminal project with GitHub profile and projects integration.<br/>
                Available commands: help, profile, projects, contact, social media, clear.
            `;
        }else{
            cat.innerHTML = `'${fileName}' file not found.`;
        }

        main.appendChild(cat);
        return;
    }

    switch (normalizedAction) {
        case "clear":
            main.innerHTML = '';
            break;
        case "about":
            const about = document.createElement('div');
            about.innerHTML = `
                Web-Terminal portfolio interface.<br/>
                Type <b>help</b> to view available commands.
            `;
            main.appendChild(about);
            break;
        case "version":
            const version = document.createElement('div');
            version.innerText = currentDeployedVersion ? `v${currentDeployedVersion}` : 'version unavailable';
            main.appendChild(version);
            break;
        case "date":
        case "time":
            const dt = document.createElement('div');
            dt.innerText = new Date().toString();
            main.appendChild(dt);
            break;
        case "whoami":
            const whoami = document.createElement('div');
            whoami.innerText = user?.login || 'guest';
            main.appendChild(whoami);
            break;
        case "pwd":
            const pwd = document.createElement('div');
            pwd.innerText = '/home/user/web-terminal';
            main.appendChild(pwd);
            break;
        case "ls":
            const ls = document.createElement('div');
            ls.innerText = 'README.md  profile  projects  contact  social-media';
            main.appendChild(ls);
            break;
        case "projects":
            const projects = document.createElement("div");
            projects.classList.add('projects');
            main.appendChild(projects);
            repositories
                .forEach((rep, index) => {
                    if(rep.description && (index==5 || index==2 ||index==8 ||index==10 ||index==11 ||index==15 ||index==18 ||index==19 ||index==20 ||index==22)){
                        const repoEl = document.createElement("a");
                        repoEl.href = rep.html_url;
                        repoEl.target="_blank";
                        repoEl.innerHTML = `
                        <h2>${rep.name}</h2><div>${rep.description}</div>`;

                        projects.appendChild(repoEl);
                    }
                });
                const p = document.createElement("p");
                p.style.color="#FD6056";
                p.innerHTML ="<br/>to apply or remove styling use the command 'projects -w -s'<br/> "
                main.appendChild(p);
            break;
        case "projects -w -s":
            document.querySelectorAll('.projects a')
                .forEach(rep => {
                    rep.style.color ="white";
                    rep.classList.toggle('repository');
                });
            break;
        case 'profile':
            const profile = document.createElement("div");
            profile.innerHTML = `
                <div class="about">
                    <div>
                        <a target="_blank" href="${user.html_url}">
                            <img class="avatar" src="${user.avatar_url}" alt="${user.name}" />
                        </a>
                    </div>
                    <div class="user-info">
                        <a target="_blank" href="${user.html_url}"><h2>${user.name}</h2></a>
                        <p>${user.bio}</p>
                        <h5>Repositories:</h5>
                        <div id="repos${r}"></div>
                    </div>
                </div>`;

                main.appendChild(profile);

                top10Repositories();
            break;
        case 'help':
            const help = document.createElement("div");
            help.classList.add('help')
            help.innerHTML = `
            <div>
                CLEAR<br/>
                ABOUT<br/>
                VERSION<br/>
                DATE / TIME<br/>
                ECHO [TEXT]<br/>
                WHOAMI<br/>
                PWD<br/>
                LS<br/>
                CAT README.MD<br/>
                PROJECTS<br/>
                PROFILE<br/>
                CONTACT<br/>
                WEB-TERMINAL --V<BR/>
                TIME<BR/>
               
            </div>
            <div>
                Clear all screen content <br>
                Show information about this web terminal<br>
                Shows currently deployed version from version.json<br>
                Shows current date/time<br>
                Prints text in terminal<br>
                Shows current user<br>
                Shows current virtual directory path<br>
                Lists available virtual files/sections<br>
                Shows basic README content<br>
                Shows the top 10 projects from the configured GitHub profile <br>
                Shows a preview of the profile on GitHub.<br>
                Shows contacts like email and cell phone number<br>
                Shows the version of the web terminal
            </div>
            `;
            main.appendChild(help);
            break;
        case "contact":
            const contact = document.createElement("div");
            contact.classList.add('contacts')
            contact.innerHTML = `
                <label>
                    <i class="fas fa-envelope"></i>
                    <b>Email</b>: 
                </label>
                <a href="mailto:contact@example.com?subject=Hello!!">contact@example.com</a><br>

                <label>
                    <i class="fas fa-phone-alt"></i> 
                    <b>Phone</b>: 
                </label> 
                <a href=”tel:+5584992207080″>+55 (84) 9 9220 - 7080</a><br/><br/>

                <p>Or if you prefer, check out the social media by <a target="_blank" href="https://example.com">clicking here</a> or by running the command: <span>social media</span></p>
            `;
            main.appendChild(contact);
            break;
        case "social media":
            window.open('https://example.com');
            break;
        case "web-terminal --v":
            const v = document.createElement("div");
            v.innerHTML = `
                v1.0.0
            `;
            main.appendChild(v);
            break;
        default:
        element.innerHTML = `User:~ Web-Terminal$  ${rawAction}<br>'${rawAction}' is not recognized as an internal or external command, an operable program or a batch file.`
        break;
    }
}

function top10Repositories(){
    const reposEl = document.getElementById(`repos${r}`);
    repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .forEach((repo) => {
            const repoEl = document.createElement("a");
            repoEl.classList.add("repo");
            repoEl.href = repo.html_url;
            repoEl.target = "_blank";
            repoEl.innerText = repo.name;
            reposEl.appendChild(repoEl);
        });
        r++;
}