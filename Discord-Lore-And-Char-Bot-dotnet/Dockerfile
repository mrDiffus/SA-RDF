FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copy project files using repo-root paths for solid caching
COPY Discord-Lore-And-Char-Bot-dotnet/Discord-Lore-And-Char-Bot-dotnet.csproj Discord-Lore-And-Char-Bot-dotnet/
RUN dotnet restore Discord-Lore-And-Char-Bot-dotnet/Discord-Lore-And-Char-Bot-dotnet.csproj

# 2. Bring in the source code and the parallel data files
COPY Discord-Lore-And-Char-Bot-dotnet/. Discord-Lore-And-Char-Bot-dotnet/
COPY public/data ./public/data

# 3. Compile the application
WORKDIR /src/Discord-Lore-And-Char-Bot-dotnet
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app

# Pull compiled binaries
COPY --from=build /app/publish ./

# Grab the data assets and game lore files from the build workspace
COPY --from=build /src/public/data ./public/data
COPY --from=build /src/Discord-Lore-And-Char-Bot-dotnet/persona.md ./persona.md

RUN mkdir -p /app/storage

ENV DOTNET_ENVIRONMENT=Production \
    Bot__DataRoot=/app/public/data \
    Bot__ProfileStorePath=/app/storage/profiles.json \
    Bot__PersonaPath=/app/persona.md \
    Bot__AssetManifestPath=/app/storage/assets_manifest.json

ENTRYPOINT ["dotnet", "Discord-Lore-And-Char-Bot-dotnet.dll"]