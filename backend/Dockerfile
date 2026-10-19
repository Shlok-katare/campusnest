# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -B -q -DskipTests package

# ---- run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home appuser
COPY --from=build /build/target/*.jar app.jar
USER appuser
EXPOSE 8080
# Keep the heap inside small free-tier containers (512 MB).
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "/app/app.jar"]
