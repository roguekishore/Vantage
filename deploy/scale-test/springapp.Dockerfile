# JVM image for the scale test. Same stages as springapp/Dockerfile (context = springapp/), except that it
# deletes any local, gitignored application.properties so no developer secrets or production URLs are baked in.
# All settings come from the compose environment.
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
RUN chmod +x mvnw
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B
COPY src src
RUN rm -f src/main/resources/application.properties && \
    ./mvnw package -DskipTests -B && cp target/*.jar target/app.jar

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
ENV TZ=UTC
ENV JAVA_OPTS="-Duser.timezone=UTC -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
