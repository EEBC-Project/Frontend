# RAG Service Frontend 🚀

A modern, interactive PDF question answering application built with Next.js that allows users to upload PDF documents and ask questions about their content through an AI-powered chat interface.

## ✨ Features

- **PDF Upload**: Upload PDF documents for analysis
- **Interactive Q&A**: Ask questions about uploaded document content
- **Real-time Responses**: Get instant answers powered by Groq's Llama 3 70B model
- **Beautiful UI**: Modern, responsive design with smooth animations and loading states
- **Progressive Loading**: Engaging loading messages that keep users informed during processing
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.25
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Backend**: FastAPI RAG Service with Groq API

## 🚀 Getting Started

### Prerequisites

Before running the application, make sure you have:

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun package manager
- A running RAG backend server (see Backend folder)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
Frontend/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── ui/              # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   └── utils.ts         # Utility functions
├── public/              # Static assets
└── ...configuration files
```

## 🔧 Configuration

### Backend Integration

The application is configured to connect to your RAG backend server:

- **Upload API**: `http://localhost:8000/upload`
- **Chat API**: `http://localhost:8000/tools/rag`

### API Endpoints

#### Upload Endpoint

```typescript
POST http://localhost:8000/upload
Content-Type: multipart/form-data

{
  "file": <PDF file>
}
```

#### Chat Endpoint

```typescript
POST http://localhost:8000/tools/rag
Content-Type: application/json

{
  "question": "What is this document about?"
}
```

## 🚀 Deployment

### Local Development

Run both backend and frontend locally for development:

1. **Start Backend** (see Backend folder README)

   ```bash
   cd Backend
   python app.py
   ```

2. **Start Frontend**
   ```bash
   cd Frontend
   pnpm dev
   ```

### Production Build

#### Build for Production

```bash
npm run build
npm run start
```

#### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎨 Customization

### Styling

- The application uses Tailwind CSS for styling
- UI components are built with shadcn/ui
- Customize colors and themes in `tailwind.config.js`

### Backend URLs

- Update API endpoints in `app/page.tsx` if needed
- Default backend URL: `http://localhost:8000`

## 📱 Usage

### PDF Upload

1. Click "Choose File" and select a PDF document
2. Click "Upload" button
3. Wait for the upload and processing to complete
4. Receive confirmation with number of text chunks created

### Ask Questions

1. Type your question about the uploaded PDF in the chat input
2. Press Enter or click Send
3. Wait for the AI-powered response
4. View beautiful loading animations during processing

## 🐛 Troubleshooting

### Common Issues

1. **Loading issues**: Check if the backend server is running on port 8000
2. **CORS errors**: Ensure backend allows localhost origins
3. **Upload errors**: Verify PDF file format and size
4. **Build errors**: Check Node.js version compatibility
5. **Hydration errors**: Clear browser cache and restart dev server

### Debug Mode

Check browser console for detailed error messages and API response logs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🙋‍♂️ Support

For support or questions:

- Create an issue in the repository
- Check that both backend and frontend are running properly
- Verify backend at `http://localhost:8000/docs`

---

Built with ❤️ using Next.js, FastAPI, and Groq API
