# -------- Build Stage --------
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml
COPY fleet_track/pom.xml ./pom.xml

# Download dependencies
RUN mvn dependency:go-offline

# Copy source code
COPY fleet_track/src ./src

# Build jar
RUN mvn clean package -DskipTests

# -------- Run Stage --------
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
