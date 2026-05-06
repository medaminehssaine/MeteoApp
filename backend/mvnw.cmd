@REM Maven Wrapper startup script for Windows
@REM
@setlocal

@set WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar
@set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
@set MAVEN_PROJECTBASEDIR=%~dp0

@REM Download wrapper jar if not present
@if not exist "%WRAPPER_JAR%" (
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%' -UseBasicParsing"
)

@set MAVEN_CMD_LINE_ARGS=%*
@java -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%." -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%
