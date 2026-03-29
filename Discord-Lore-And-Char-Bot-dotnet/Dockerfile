FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file first for better layer caching during restore.
COPY Discord-Lore-And-Char-Bot-dotnet/Discord-Lore-And-Char-Bot-dotnet.csproj Discord-Lore-And-Char-Bot-dotnet/
RUN dotnet restore Discord-Lore-And-Char-Bot-dotnet/Discord-Lore-And-Char-Bot-dotnet.csproj

# Copy bot source and shared data files.
COPY Discord-Lore-And-Char-Bot-dotnet/. Discord-Lore-And-Char-Bot-dotnet/
COPY public/data ./public/data

WORKDIR /src/Discord-Lore-And-Char-Bot-dotnet
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish ./
COPY --from=build /src/public/data ./public/data
COPY --from=build /src/Discord-Lore-And-Char-Bot-dotnet/persona.md ./persona.md

RUN mkdir -p /app/storage

ENV DOTNET_ENVIRONMENT=Production \
	Bot__DataRoot=/app/public/data \
	Bot__ProfileStorePath=/app/storage/profiles.json \
	Bot__PersonaPath=/app/persona.md \
	Bot__AssetManifestPath=/app/storage/assets_manifest.json

ENTRYPOINT ["dotnet", "Discord-Lore-And-Char-Bot-dotnet.dll"]
