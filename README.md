--- README.md (原始)
# sosclt-app
nosso novo aplicativo sosclt-app

+++ README.md (修改后)
# SOSCLT - App de Proteção Trabalhista

[![Expo SDK 50+](https://img.shields.io/badge/Expo-SDK%2050+-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-brightgreen.svg)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

## 📱 Sobre o Projeto

O **SOSCLT** é um aplicativo de proteção trabalhista que permite gravar áudio em situações de emergência com apenas um toque. Ideal para trabalhadores que precisam documentar situações irregulares no ambiente de trabalho.

### Funcionalidades Principais

- ✅ **Botão SOS**: Segure por 3 segundos para iniciar gravação
- ✅ **Gravação em Background**: Continua gravando mesmo com tela desligada (Android + iOS)
- ✅ **Ativação Rápida**: Widget na home screen para acionamento sem abrir o app
- ✅ **Envio para WhatsApp**: Compartilhe gravações diretamente com contatos de emergência
- ✅ **Armazenamento Cloud**: Upload automático para Supabase Storage
- ✅ **Metadados Completos**: User ID, timestamp, duração da gravação

---

## 📁 Estrutura do Projeto

```
sosclt/
├── app/                          # Telas do app (Expo Router)
│   └── index.tsx                 # Tela Home principal
├── components/                   # Componentes React Native reutilizáveis
│   ├── SOSButton.tsx             # Botão SOS com animação
│   └── CountdownAnimation.tsx    # Animação de contagem regressiva
├── services/                     # Serviços e integrações
│   ├── audioRecording.ts         # Serviço de gravação de áudio
│   ├── supabase.ts               # Integração com Supabase
│   └── whatsapp.ts               # Integração com WhatsApp
├── android/                      # Código nativo Android
│   └── app/src/main/
│       ├── AndroidManifest.xml   # Permissões e configurações
│       ├── java/com/sosclt/
│       │   ├── SOSService.kt     # Foreground Service para gravação
│       │   └── SOSWidgetProvider.kt  # Widget de ativação rápida
│       └── res/                  # Recursos Android (layouts, drawables)
├── ios/                          # Código nativo iOS
│   ├── SOSCLT/
│   │   ├── Info.plist            # Configurações iOS (background audio)
│   │   └── AudioSessionManager.swift  # Gerenciador de sessão de áudio
│   └── SOSCLTWidget/             # Widget do iOS
│       └── SOSCLTWidget.swift
├── assets/                       # Imagens e ícones
├── utils/                        # Utilitários gerais
├── app.json                      # Configuração Expo
├── package.json                  # Dependências Node.js
├── supabase-schema.sql           # Schema do banco de dados
└── README.md                     # Este arquivo
```

---

## 🚀 Setup Local (Opcional)

### Pré-requisitos

- Node.js 18+ instalado
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Conta no Supabase (gratuita)
- Xcode (para iOS) ou Android Studio (para Android)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <repository-url>
cd sosclt
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Supabase**
   - Crie uma conta em [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Execute o script `supabase-schema.sql` no SQL Editor do Supabase
   - Crie um bucket chamado `sos-recordings` no Storage
   - Copie as credenciais (URL e Anon Key)

4. **Atualize as credenciais no `app.json`**
```json
{
  "extra": {
    "supabaseUrl": "https://your-project.supabase.co",
    "supabaseAnonKey": "your-anon-key"
  }
}
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm start
```

6. **Execute no dispositivo**
   - Escaneie o QR code com o app Expo Go (iOS/Android)
   - Ou pressione `a` para Android Emulator / `i` para iOS Simulator

---

## ☁️ Build na Nuvem com EAS

### Configuração Inicial

1. **Login na conta Expo**
```bash
eas login
```

2. **Configure o EAS**
```bash
eas build:configure
```

3. **Crie o perfil de build (`eas.json`)**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

### Build para Android

```bash
# APK para teste interno
eas build --platform android --profile preview

# App Bundle para Google Play Store
eas build --platform android --profile production
```

### Build para iOS

```bash
# Build para simulador
eas build --platform ios --profile preview

# Build para App Store
eas build --platform ios --profile production
```

### Submissão às Lojas

```bash
# Android (Google Play)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```

---

## ⚙️ Configurações Nativas Importantes

### Android

#### [⚠️ ATENÇÃO] Permissões no AndroidManifest.xml

Certifique-se de que estas permissões estão presentes:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

#### Foreground Service

O arquivo `SOSService.kt` implementa um serviço em foreground que mantém a gravação ativa mesmo com a tela desligada. Requer Android 12+ para `foregroundServiceType="microphone"`.

#### Widget de Ativação Rápida

Para adicionar o widget à home screen:
1. Toque longo na home screen
2. Selecione "Widgets"
3. Encontre "SOSCLT" ou "SOS Rápido"
4. Arraste para a home

### iOS

#### [⚠️ ATENÇÃO] Configurações no Info.plist

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Este app precisa acessar o microfone para gravar áudio em situações de emergência.</string>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>

<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.sosclt.app</string>
</array>
```

#### App Group Configuration

Para comunicação entre o Widget e o App Principal:

1. Abra o projeto no Xcode
2. Selecione ambos os targets (app principal e widget)
3. Vá em "Signing & Capabilities"
4. Adicione "App Groups"
5. Crie o grupo: `group.com.sosclt.app`
6. Marque o mesmo grupo em ambos os targets

#### Widget no iOS

Para adicionar o widget:
1. Toque longo na home screen
2. Toque no "+" no canto superior esquerdo
3. Busque por "SOSCLT" ou "SOS Rápido"
4. Escolha o tamanho e adicione

---

## 🔧 Solução de Erros Comuns

### Erro: "Permissão de microfone negada"

**Solução:**
- Android: Vá em Configurações > Apps > SOSCLT > Permissões > Microfone > Permitir
- iOS: Vá em Ajustes > SOSCLT > Ative "Microfone"

### Erro: "Gravação para após bloquear tela"

**Solução Android:**
- Verifique se `FOREGROUND_SERVICE_MICROPHONE` está no manifest
- Confirme que o `SOSService` está registrado como service

**Solução iOS:**
- Verifique se `UIBackgroundModes` inclui "audio" no Info.plist
- Confirme que `AVAudioSession` está configurado corretamente

### Erro: "Falha no upload para Supabase"

**Solução:**
- Verifique se as credenciais estão corretas no `app.json`
- Confirme que o bucket `sos-recordings` existe e é público
- Verifique as políticas RLS no Supabase

### Erro: "Widget não inicia gravação"

**Solução Android:**
- Verifique se o `SOSWidgetProvider` está registrado no manifest
- Confirme que as permissões de foreground service estão ativas

**Solução iOS:**
- Verifique se o App Group está configurado em ambos os targets
- Confirme que o código de comunicação via UserDefaults está correto

### Erro: "Build falha no EAS"

**Solução:**
- Execute `eas build --clean` para limpar cache
- Verifique se todas as dependências estão instaladas
- Confira se as configurações nativas foram aplicadas corretamente

---

## 📊 Banco de Dados Supabase

### Tabelas Principais

#### users
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único do usuário |
| name | VARCHAR | Nome completo |
| whatsapp_contact | VARCHAR | Número para contato de emergência |
| email | VARCHAR | Email opcional |

#### sos_records
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID da gravação |
| user_id | UUID | Referência ao usuário |
| file_url | TEXT | URL pública do arquivo |
| duration | NUMERIC | Duração em segundos |
| created_at | TIMESTAMP | Data/hora da gravação |
| sent_via_whatsapp | BOOLEAN | Se foi enviado via WhatsApp |

### Executar Schema

1. Acesse o Dashboard do Supabase
2. Vá em SQL Editor
3. Copie e cole o conteúdo de `supabase-schema.sql`
4. Execute

---

## 🔐 Privacidade e Segurança

- As gravações são armazenadas de forma segura no Supabase
- URLs públicas são geradas apenas para compartilhamento via WhatsApp
- Row Level Security (RLS) garante que usuários vejam apenas seus dados
- Permissões de microfone são solicitadas explicitamente

---

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

## 👥 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue neste repositório ou entre em contato com a equipe de desenvolvimento.

**Desenvolvido com ❤️ para proteção dos trabalhadores brasileiros**
