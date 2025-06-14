# 🎧 Tumo Beats

![alt text](images/icons-vector.svg)

**Tumo Beats** é uma aplicação web progressiva (PWA) minimalista e instalável, desenvolvida com JavaScript puro. Inclui controlos personalizados de áudio, suporte a ficheiros arrastados, e visualização em tempo real usando a Web Audio API.

---

## 🚀 Funcionalidades

- 🔊 Leitor de áudio com controlos personalizados: play/pause, anterior, seguinte, volume e silenciar
- 🎵 Visualizador de áudio em tempo real com barras de frequência via `<canvas>`
- 📦 Suporte a PWA: instalável em telemóveis e desktops
- 🎧 Suporte a arrastar e largar ficheiros MP3 ou FLAC diretamente na aplicação
- 🕒 Barra de progresso com indicador de tempo decorrido
- 🎛️ Controlo de volume dinâmico com alternância entre som e mudo
- 🖼️ Interface responsiva com logótipo Tumo e nome da música atual

---

## 🖼️ Captura de Ecrã

![screenshot](images/screenshot1.png)

---

## 🗂️ Estrutura do Projeto

```plaintext
/
├── index.html              # Página principal
├── manifest.json           # Manifesto da PWA
├── service-worker.js       # Service worker para suporte offline
├── data.json               # Lista de músicas pré-definida
├── music/                  # Musicas
│   ├── music1.mp3
│   └── ...
├── images/                 # Ícones e capturas de ecrã
│   ├── icons-192.webp
│   ├── icons-512.webp
│   ├── maskable_icon.webp
│   ├── screenshot1.png
│   └── ...
├── styles.css          # Estilos CSS opcionais
└── app.js              # Lógica principal do leitor e visualizador
```
