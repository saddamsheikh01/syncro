# Build context: repository root (see railway.toml dockerfilePath).
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw \
  && ./mvnw -B -DskipTests dependency:go-offline || true

COPY backend/src src
RUN ./mvnw -B -DskipTests package \
  && mv target/backend-0.0.1-SNAPSHOT.jar /tmp/app.jar

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system syncro \
  && useradd --system --gid syncro --home-dir /app --shell /usr/sbin/nologin syncro \
  && mkdir -p /data/media /data/ephe \
  && chown -R syncro:syncro /app /data

COPY --from=build /tmp/app.jar /app/app.jar
USER syncro

EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC"
ENV SPRING_PROFILES_ACTIVE=prod,railway

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
