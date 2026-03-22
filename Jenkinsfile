pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '20'))
    }

    triggers {
        // Poll repository changes every 2 minutes (use Jenkins UI if you prefer a different schedule).
        pollSCM('H/2 * * * *')
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_ENABLED',
            defaultValue: true,
            description: 'If true, files are copied to DEPLOY_PATH after validation.'
        )
        string(
            name: 'DEPLOY_PATH',
            defaultValue: '',
            description: 'Absolute path served by your web server (for example C:/inetpub/wwwroot/info-terminal or /var/www/html/info-terminal).'
        )
        string(
            name: 'REPO_URL',
            defaultValue: 'https://github.com/JaisonJecinthVincent/SimpleWebTerminal.git',
            description: 'Git repository URL used when job runs as inline Pipeline script (no SCM context).'
        )
        string(
            name: 'BRANCH_SPEC',
            defaultValue: '*/master',
            description: 'Branch spec used for explicit checkout fallback (for example */master or */main).'
        )
        string(
            name: 'GIT_CREDENTIALS_ID',
            defaultValue: '',
            description: 'Optional Jenkins credentials ID for private repositories when fallback checkout is used.'
        )
        booleanParam(
            name: 'DOCKER_DEPLOY_ENABLED',
            defaultValue: false,
            description: 'If true, pipeline builds a Docker image and deploys/restarts a container.'
        )
        string(
            name: 'DOCKER_IMAGE_NAME',
            defaultValue: 'simple-web-terminal',
            description: 'Docker image name used for build and run.'
        )
        string(
            name: 'DOCKER_CONTAINER_NAME',
            defaultValue: 'simple-web-terminal',
            description: 'Container name used during deployment.'
        )
        string(
            name: 'DOCKER_HOST_PORT',
            defaultValue: '8081',
            description: 'Host port mapped to container port 80.'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    def checkoutCompleted = false

                    try {
                        checkout scm
                        checkoutCompleted = true
                        echo 'Checkout complete using SCM context.'
                    } catch (Exception ex) {
                        echo 'checkout scm is unavailable for this job type. Using explicit Git checkout fallback.'
                    }

                    if (!checkoutCompleted) {
                        def repoUrl = params.REPO_URL?.trim()
                        def branchSpec = params.BRANCH_SPEC?.trim() ? params.BRANCH_SPEC.trim() : '*/master'
                        def credentialsId = params.GIT_CREDENTIALS_ID?.trim()

                        if (!repoUrl) {
                            error('REPO_URL is required when this job runs as inline Pipeline script.')
                        }

                        def remoteConfig = [url: repoUrl]
                        if (credentialsId) {
                            remoteConfig.credentialsId = credentialsId
                        }

                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: branchSpec]],
                            doGenerateSubmoduleConfigurations: false,
                            extensions: [],
                            userRemoteConfigs: [remoteConfig]
                        ])

                        echo "Checkout complete from ${repoUrl} (${branchSpec})."
                    }
                }
            }
        }

        stage('Validate static files') {
            steps {
                script {
                    def requiredFiles = [
                        'index.html',
                        'assets/css/style.css',
                        'assets/js/script.js'
                    ]

                    def missingFiles = requiredFiles.findAll { !fileExists(it) }
                    if (!missingFiles.isEmpty()) {
                        error("Missing required files: ${missingFiles.join(', ')}")
                    }
                }
            }
        }

        stage('Generate build metadata') {
            steps {
                script {
                    def builtAt = new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone('UTC'))
                    def version = env.BUILD_NUMBER ?: 'dev'

                    writeFile(
                        file: 'version.json',
                        text: "{\n  \"version\": \"${version}\",\n  \"builtAt\": \"${builtAt}\"\n}\n"
                    )

                    echo "Build metadata generated. version=${version}, builtAt=${builtAt}"
                }
            }
        }

        stage('Archive artifacts') {
            steps {
                archiveArtifacts artifacts: 'index.html,assets/**,README.md,version.json,Dockerfile,.dockerignore', fingerprint: true
            }
        }

        stage('Build Docker image') {
            when {
                expression { params.DOCKER_DEPLOY_ENABLED }
            }
            steps {
                script {
                    def imageName = params.DOCKER_IMAGE_NAME?.trim() ?: 'simple-web-terminal'

                    if (isUnix()) {
                        sh "docker build -t ${imageName}:latest ."
                    } else {
                        withEnv(["IMAGE_NAME=${imageName}"]) {
                            powershell '''
                                $ErrorActionPreference = "Stop"
                                if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                                    throw "Docker CLI not found on Jenkins agent."
                                }

                                docker build -t "$env:IMAGE_NAME:latest" .
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy Docker container') {
            when {
                expression { params.DOCKER_DEPLOY_ENABLED }
            }
            steps {
                script {
                    def imageName = params.DOCKER_IMAGE_NAME?.trim() ?: 'simple-web-terminal'
                    def containerName = params.DOCKER_CONTAINER_NAME?.trim() ?: 'simple-web-terminal'
                    def hostPort = params.DOCKER_HOST_PORT?.trim() ?: '8081'

                    if (!(hostPort ==~ /^[0-9]{2,5}$/)) {
                        error('DOCKER_HOST_PORT must be a numeric port value (for example 8081).')
                    }

                    if (isUnix()) {
                        withEnv([
                            "IMAGE_NAME=${imageName}",
                            "CONTAINER_NAME=${containerName}",
                            "HOST_PORT=${hostPort}"
                        ]) {
                            sh '''
                                set -eu

                                if ! command -v docker >/dev/null 2>&1; then
                                    echo "Docker CLI not found on Jenkins agent."
                                    exit 1
                                fi

                                existing_container=$(docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format "{{.Names}}")
                                if [ -n "$existing_container" ]; then
                                    docker rm -f "$CONTAINER_NAME"
                                fi

                                docker run -d \
                                    --name "$CONTAINER_NAME" \
                                    -p "$HOST_PORT:80" \
                                    --restart unless-stopped \
                                    "$IMAGE_NAME:latest"
                            '''
                        }
                    } else {
                        withEnv([
                            "IMAGE_NAME=${imageName}",
                            "CONTAINER_NAME=${containerName}",
                            "HOST_PORT=${hostPort}"
                        ]) {
                            powershell '''
                                $ErrorActionPreference = "Stop"

                                if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                                    throw "Docker CLI not found on Jenkins agent."
                                }

                                $existingContainer = docker ps -a --filter "name=^/$env:CONTAINER_NAME$" --format "{{.Names}}"
                                if ($existingContainer) {
                                    docker rm -f $env:CONTAINER_NAME | Out-Null
                                }

                                docker run -d --name $env:CONTAINER_NAME -p "$env:HOST_PORT`:80" --restart unless-stopped "$env:IMAGE_NAME`:latest" | Out-Null
                                Write-Host "Container deployed at http://localhost:$env:HOST_PORT"
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy static files') {
            when {
                expression { !params.DOCKER_DEPLOY_ENABLED && params.DEPLOY_ENABLED && params.DEPLOY_PATH?.trim() }
            }
            steps {
                script {
                    def deployPath = params.DEPLOY_PATH.trim()

                    if (isUnix()) {
                        withEnv(["TARGET_PATH=${deployPath}"]) {
                            sh '''
                                set -eu
                                mkdir -p "$TARGET_PATH"

                                if [ -d "$TARGET_PATH/assets" ]; then
                                    rm -rf "$TARGET_PATH/assets"
                                fi

                                cp -R assets "$TARGET_PATH/assets"
                                cp index.html "$TARGET_PATH/index.html"

                                if [ -f README.md ]; then
                                    cp README.md "$TARGET_PATH/README.md"
                                fi
                            '''
                        }
                    } else {
                        withEnv(["TARGET_PATH=${deployPath}"]) {
                            powershell '''
                                $ErrorActionPreference = "Stop"

                                if (-not (Test-Path $env:TARGET_PATH)) {
                                    New-Item -ItemType Directory -Path $env:TARGET_PATH -Force | Out-Null
                                }

                                $targetAssets = Join-Path $env:TARGET_PATH "assets"
                                if (Test-Path $targetAssets) {
                                    Remove-Item $targetAssets -Recurse -Force
                                }

                                Copy-Item "assets" $targetAssets -Recurse -Force
                                Copy-Item "index.html" (Join-Path $env:TARGET_PATH "index.html") -Force

                                if (Test-Path "README.md") {
                                    Copy-Item "README.md" (Join-Path $env:TARGET_PATH "README.md") -Force
                                }
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check stage logs for details.'
        }
        always {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
