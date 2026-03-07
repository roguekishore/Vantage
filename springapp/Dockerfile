# ============================================================
#  Multi-stage Dockerfile for Vantage API (Spring Boot 4 / Java 17)
# ============================================================
#
#  BUILD (multi-arch):
#    docker buildx build --platform linux/amd64,linux/arm64 \
#      -t roguekishore/vantage .
#
#  BUILD + PUSH (multi-arch):
#    docker buildx build --platform linux/amd64,linux/arm64 \
#      -t roguekishore/vantage --push .
#
#  RUN:
#    docker run -d --name vantage-api -p 8080:8080 \
#      -e DB_URL=jdbc:mysql://<host>:3306/dsa?createDatabaseIfNotExist=true \
#      -e DB_USERNAME=root \
#      -e DB_PASSWORD=<password> \
#      -e JWT_SECRET=<your-production-secret-min-32-chars> \
#      -e ALLOWED_ORIGINS=https://your-cloudfront.net,https://yourdomain.com \
#      roguekishore/vantage
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Cache Maven wrapper + dependencies first (layer caching)
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
RUN chmod +x mvnw

# Copy only the POM so dependencies are downloaded before source changes
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

# Now copy the full source and build the fat JAR
COPY src src
RUN ./mvnw package -DskipTests -B && \
    cp target/*.jar target/app.jar

# ── Stage 2: Runtime ───────────────────────────────────────
FROM eclipse-temurin:17-jre

LABEL maintainer="roguekishore"
LABEL description="Vantage — AlgoVisualizer Spring Boot backend API"

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser
WORKDIR /app

COPY --from=build /app/target/app.jar app.jar
RUN chown -R appuser:appuser /app

USER appuser

# Spring Boot default port
EXPOSE 8080

# Health check via Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM tuning: respect container memory limits
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
