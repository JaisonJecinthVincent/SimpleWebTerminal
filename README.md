<h1 align="center">
  <strong>Info with web-terminal</strong>
</h1>

<p align="center">
  <a href="#-Technologies">Technologies</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-Project">Project</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-Access">Access</a>&nbsp;&nbsp;&nbsp;
</p>

<br>

<p align="center">
  <p align="center">
  <img alt="Preview" src=".github/preview.gif" width="100%">
</p>

</p>

## 🚀 Technologies

<details>
<summary><b> PT-br</b></summary>
<p>
Este aplicativo foi desenvolvido com as seguintes tecnologias:
</p>
<hr>
</details>
This application was developed with the following technologies:

- HTML 5
- CSS 3
- JavaScript

## 💻 Project
<details>
<summary><b> PT-br</b></summary>
<p>
Este projeto é um sistema simples para funcionar como uma ideia central de um portfólio. O conceito é que o seu design seja semelhante ao terminal do sistema operacional Mac. <br>
Construído com as tecnologias HTML 5, CSS 3 e Javascript vanilla é possível ter acesso à algumas de minhas informações retiradas da API do GitHub e algumas outras adicionadas por mim como meus contatos.
</p>
<hr>
</details>
<p>    

This project is a simple system to function as a central idea of ​​a portfolio. The concept is that its design is similar to the terminal of the Mac operating system. <br>
Built with HTML 5, CSS 3 and Javascript vanilla technologies it is possible to access some of my information taken from the GitHub API and some others added by me as my contacts.
</p>

## 📍 Access

<details>
<summary><b> PT-br</b></summary>
Ao acessar você terá a possibilidade de utilizar o comando help para conhecer os comandos disponíveis até o momento para serem utilizados.

Exemplo de comandos disponíveis:

- `CLEAR`: Limpar todo o conteúdo da tela
- `PROJETOS`: mostra os 10 principais projetos do perfil configurado no github
- `PROFILE`: mostra uma prévia do perfil no GitHub.
- `CONTACT`: Mostra contatos como e-mail e número de telefone celular

<p> Build and run locally with Docker to access the system. </p>

<hr>
</details>

Accessing you will have the possibility to use the `help` command to get to know the commands available so far to be used.

Example of available commands:
- `CLEAR`: Clear all screen content
- `PROJECTS`: Shows the top 10 projects from the configured GitHub profile
- `PROFILE`: Shows a preview of the profile on GitHub.
- `CONTACT`: Shows contacts like email and cell phone number

<p> Build and run locally with Docker to access the system.</p>

---

## Jenkins CI/CD (Docker Mandatory)

Use the included `Jenkinsfile` to run the pipeline automatically using SCM polling.

1. Install required Jenkins plugins:
  - Pipeline
  - Git
  - GitHub Integration (or GitHub plugin)

2. Create a Jenkins Pipeline job:
  - In Jenkins, click New Item -> Pipeline.
  - Under Pipeline Definition, choose Pipeline script from SCM.
  - SCM: Git.
  - Repository URL: your GitHub repository URL for this project.
  - Script Path: `Jenkinsfile`

3. Configure build trigger in Jenkins job:
  - Enable `Poll SCM`.
  - Poll schedule example: `H/2 * * * *`
  - For true change-based polling, use `Pipeline script from SCM` (job-level SCM context).

4. Configure job parameters:
  - `DOCKER_IMAGE_NAME`: image name (for example `simple-web-terminal`).
  - `DOCKER_CONTAINER_NAME`: container name (for example `simple-web-terminal`).
  - `DOCKER_HOST_PORT`: host port for website (for example `8081`).
  - `REPO_URL`: used only if the job is running in inline Pipeline mode.
  - `BRANCH_SPEC`: branch pattern for fallback checkout (for example `*/master`).
  - `GIT_CREDENTIALS_ID`: optional credentials ID for private repositories.

5. Run one manual build to initialize job properties, then push a commit and verify the next poll cycle triggers a build.

Note:
- If you keep Jenkins in inline Pipeline script mode, fallback checkout works, but polling behaves like timed runs instead of true change detection.

Pipeline behavior:
- Checkout repository (uses `checkout scm`, and falls back to explicit Git checkout when SCM context is unavailable)
- Validate required static files
- Generate `version.json` metadata per build
- Archive build artifacts
- Build Docker image on every run (`--pull --no-cache`)
- Restart Docker container on every run

### Automatic browser refresh after deployment

The app now polls `version.json` every 15 seconds. When Jenkins deploys a newer build (new version), open browser tabs automatically reload and show the latest changes.

The container also serves no-cache headers through `nginx.conf` to reduce stale browser content after deployment.

This works with Docker deployment on every pipeline run.

<p align="center">
Developed with ❤ by <a target="_blank" href="https://example.com">Project Team</a>. 👋🏻<br/>