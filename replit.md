# Overview

This project is a Nigerian Legal AI Assistant - a modern full-stack web application that provides AI-powered legal guidance specifically tailored for Nigerian law and jurisprudence. The application serves as a professional legal consultation platform where users can interact with an AI assistant trained on Nigerian legal matters, upload legal documents for analysis, and receive expert guidance on contracts, compliance, and legal research.

The system features a tiered subscription model (Free, Pro, Premium) with usage-based limits, real-time chat functionality, document upload and analysis capabilities, and secure user authentication. It's designed to democratize access to legal expertise while maintaining professional standards for legal consultation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React 18 with TypeScript, utilizing Vite as the build tool for optimal development experience and performance. The UI is constructed with Radix UI components and styled using Tailwind CSS with shadcn/ui component library for a consistent, accessible design system.

Key frontend architectural decisions:
- **Component Structure**: Modular component architecture with separate concerns for authentication, chat interface, and UI elements
- **State Management**: React hooks-based state management with React Query for server state synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat features and typing indicators
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The backend follows a RESTful API design pattern built on Express.js with TypeScript, providing a robust foundation for the legal AI services.

Core backend components:
- **API Layer**: Express.js server with structured route handlers for authentication, chat sessions, file management, and AI interactions
- **AI Integration**: OpenAI GPT-4o integration with specialized legal assistant configuration for Nigerian law
- **File Processing**: Multer-based file upload system with document analysis capabilities
- **Real-time Features**: WebSocket server implementation for live chat functionality and user presence

## Data Storage Solutions
The application uses a PostgreSQL database accessed through Drizzle ORM, providing type-safe database operations and migrations.

Database schema design:
- **User Management**: Users table with tier-based subscription levels (free, pro, premium)
- **Chat System**: Structured chat sessions and messages with metadata support
- **File Management**: Uploaded files tracking with processing status and storage paths  
- **Usage Tracking**: User usage monitoring for tier-based limits enforcement
- **Subscription System**: Subscription and payment tracking integration

The choice of PostgreSQL provides ACID compliance and robust relational data handling, while Drizzle ORM ensures type safety and developer productivity with automatic schema inference.

## Authentication and Authorization
The system implements a simplified authentication mechanism focused on user identification and session management:
- **User Registration/Login**: Email-based authentication with user profile management
- **Session Management**: Server-side session tracking for chat continuity
- **Tier-based Access Control**: Usage limits enforced based on user subscription tiers
- **API Security**: Request validation and user context preservation across API calls

## External Dependencies

### AI and Language Processing
- **OpenAI API**: Primary AI service using GPT-4o model with custom Nigerian legal assistant configuration
- **Specialized Legal Training**: Assistant configured with expertise in Nigerian Constitution, corporate law, contract law, criminal procedure, property law, and other Nigerian legal domains

### File Storage and Management
- **Supabase Storage**: Cloud storage solution for legal document uploads and management
- **File Processing Pipeline**: Document analysis and content extraction for AI assistant context

### Payment Processing
- **Paystack Integration**: Nigerian payment gateway for subscription management and billing
- **Tier Management**: Automated subscription tier enforcement with usage monitoring

### Development and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting for production deployment
- **Replit Platform**: Development and hosting environment with integrated tooling
- **Vite Development Server**: Hot module replacement and optimized development workflow

### Real-time Communication
- **WebSocket Server**: Custom implementation for live chat features, typing indicators, and user presence
- **React Query**: Server state management and caching for optimal user experience

The architecture emphasizes type safety, scalability, and maintainability while providing specialized legal AI capabilities tailored specifically for the Nigerian legal system and regulatory environment.