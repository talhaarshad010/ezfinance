# syntax=docker/dockerfile:1

ARG DOTNET_VERSION=10.0

# -------------------------------------------------------------
# Stage 1: Build & Publish
# -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Copy solution and project definitions first for efficient layer caching
COPY ["EzFinance.slnx", "./"]
COPY ["src/EzFinance.Api/EzFinance.Api.csproj", "src/EzFinance.Api/"]

# Restore NuGet packages
RUN dotnet restore "src/EzFinance.Api/EzFinance.Api.csproj"

# Copy the remaining source files
COPY . .

# Build and publish the release output
WORKDIR "/src/src/EzFinance.Api"
RUN dotnet publish "EzFinance.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# -------------------------------------------------------------
# Stage 2: Runtime
# -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

# Use the built-in non-root app user for container security
USER $APP_UID

# Copy compiled binaries from the build stage
COPY --from=build /app/publish .

# Default port matching EzFinance API specification
ENV ASPNETCORE_URLS=http://+:5080
EXPOSE 5080

ENTRYPOINT ["dotnet", "EzFinance.Api.dll"]
