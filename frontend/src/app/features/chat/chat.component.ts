import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}
interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: Message[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      .chat-shell {
        display: grid;
        grid-template-columns: 260px 1fr;
        height: calc(100vh - 56px);
        gap: 0;
        background: #f8fafc;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      /* Sidebar conversations */
      .conv-sidebar {
        background: #fff;
        border-right: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
      }
      .conv-header {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
      }
      .conv-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 10px;
      }
      .btn-new-conv {
        width: 100%;
        padding: 9px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .btn-new-conv:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      .conv-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .conv-item {
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.15s;
        margin-bottom: 2px;
        position: relative;
      }
      .conv-item:hover {
        background: #f8fafc;
      }
      .conv-item.active {
        background: #eff6ff;
      }
      .conv-item-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: #334155;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .conv-item.active .conv-item-title {
        color: #3b82f6;
      }
      .conv-item-date {
        font-size: 0.68rem;
        color: #94a3b8;
        margin-top: 2px;
      }
      .conv-delete {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #cbd5e1;
        cursor: pointer;
        font-size: 0.8rem;
        opacity: 0;
        transition: opacity 0.2s;
        padding: 2px 5px;
        border-radius: 4px;
      }
      .conv-item:hover .conv-delete {
        opacity: 1;
      }
      .conv-delete:hover {
        color: #ef4444;
        background: #fef2f2;
      }
      .conv-empty {
        text-align: center;
        padding: 30px 16px;
        color: #94a3b8;
        font-size: 0.8rem;
      }

      /* Chat area */
      .chat-area {
        display: flex;
        flex-direction: column;
        background: #f8fafc;
      }
      .chat-header {
        padding: 16px 20px;
        background: #fff;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .chat-header-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
      }
      .chat-header-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
      }
      .chat-header-sub {
        font-size: 0.72rem;
        color: #94a3b8;
      }
      .groq-badge {
        margin-left: auto;
        background: rgba(99, 102, 241, 0.1);
        color: #6366f1;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        border: 1px solid rgba(99, 102, 241, 0.2);
      }

      /* Messages */
      .messages-wrap {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .messages-wrap::-webkit-scrollbar {
        width: 5px;
      }
      .messages-wrap::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 3px;
      }

      .msg {
        display: flex;
        gap: 10px;
        max-width: 80%;
      }
      .msg.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .msg.assistant {
        align-self: flex-start;
      }

      .msg-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .msg.user .msg-avatar {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        font-weight: 700;
        font-size: 0.75rem;
      }
      .msg.assistant .msg-avatar {
        background: #0f172a;
      }

      .msg-bubble {
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 0.85rem;
        line-height: 1.6;
      }
      .msg.user .msg-bubble {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .msg.assistant .msg-bubble {
        background: #fff;
        color: #334155;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        white-space: pre-wrap;
        word-break: break-word;
      }

      .msg-time {
        font-size: 0.65rem;
        color: #94a3b8;
        margin-top: 4px;
        text-align: right;
      }
      .msg.assistant .msg-time {
        text-align: left;
      }

      /* Typing indicator */
      .typing-bubble {
        background: #fff;
        padding: 14px 18px;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        display: flex;
        gap: 5px;
        align-items: center;
      }
      .typing-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #94a3b8;
        animation: bounce 0.8s infinite;
      }
      .typing-dot:nth-child(2) {
        animation-delay: 0.15s;
      }
      .typing-dot:nth-child(3) {
        animation-delay: 0.3s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-6px);
        }
      }

      /* Welcome */
      .welcome {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
      }
      .welcome-icon {
        font-size: 3rem;
        margin-bottom: 16px;
      }
      .welcome-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
      }
      .welcome-sub {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 28px;
        max-width: 400px;
        line-height: 1.6;
      }
      .suggestions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 100%;
        max-width: 500px;
      }
      .suggestion-btn {
        background: #fff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 0.8rem;
        color: #334155;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        font-family: inherit;
        line-height: 1.4;
      }
      .suggestion-btn:hover {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #3b82f6;
        transform: translateY(-1px);
      }

      /* Input */
      .input-area {
        padding: 16px 20px;
        background: #fff;
        border-top: 1px solid #f1f5f9;
      }
      .input-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }
      .msg-input {
        flex: 1;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 11px 14px;
        font-size: 0.875rem;
        color: #334155;
        font-family: inherit;
        resize: none;
        max-height: 120px;
        transition:
          border 0.2s,
          box-shadow 0.2s;
        line-height: 1.5;
      }
      .msg-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .msg-input::placeholder {
        color: #cbd5e1;
      }
      .btn-send {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      .btn-send:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(59, 130, 246, 0.4);
      }
      .btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .input-hint {
        font-size: 0.68rem;
        color: #94a3b8;
        margin-top: 6px;
        text-align: center;
      }

      @media (max-width: 768px) {
        .chat-shell {
          grid-template-columns: 1fr;
        }
        .conv-sidebar {
          display: none;
        }
      }
    </style>

    <div class="chat-shell">
      <!-- Sidebar conversations -->
      <div class="conv-sidebar">
        <div class="conv-header">
          <div class="conv-title">💬 Conversations</div>
          <button class="btn-new-conv" (click)="newConversation()">➕ Nouvelle conversation</button>
        </div>
        <div class="conv-list">
          <div
            *ngFor="let conv of conversations"
            class="conv-item"
            [class.active]="activeConvId === conv.id"
            (click)="loadConversation(conv.id)"
          >
            <div class="conv-item-title">{{ conv.title || 'Sans titre' }}</div>
            <div class="conv-item-date">{{ conv.updatedAt | date: 'dd/MM HH:mm' }}</div>
            <button class="conv-delete" (click)="deleteConv($event, conv.id)" title="Supprimer">
              🗑️
            </button>
          </div>
          <div *ngIf="!conversations.length" class="conv-empty">
            <div style="font-size:1.5rem;margin-bottom:8px">💭</div>
            Aucune conversation
          </div>
        </div>
      </div>

      <!-- Chat area -->
      <div class="chat-area">
        <div class="chat-header">
          <div class="chat-header-icon">🤖</div>
          <div>
            <div class="chat-header-title">Assistant OWASP IA</div>
            <div class="chat-header-sub">Expert sécurité applicative ASVS v4.0</div>
          </div>
          <span class="groq-badge">Groq AI</span>
        </div>

        <!-- Welcome screen -->
        <div *ngIf="!activeConvId" class="welcome">
          <div class="welcome-icon">🛡️</div>
          <div class="welcome-title">Bonjour ! Je suis votre assistant OWASP</div>
          <div class="welcome-sub">
            Posez-moi des questions sur les requirements OWASP ASVS, les vulnérabilités CWE, ou
            demandez-moi du code d'implémentation sécurisé.
          </div>
          <div class="suggestions">
            <button
              class="suggestion-btn"
              (click)="suggest('Comment implémenter une authentification JWT sécurisée ?')"
            >
              🔐 JWT sécurisé en Node.js
            </button>
            <button
              class="suggestion-btn"
              (click)="suggest('Qu est-ce que la vulnérabilité CWE-89 et comment la prévenir ?')"
            >
              🛡️ Prévenir le SQL injection
            </button>
            <button
              class="suggestion-btn"
              (click)="suggest('Comment gérer les sessions de façon sécurisée selon OWASP ?')"
            >
              🎫 Gestion des sessions OWASP
            </button>
            <button
              class="suggestion-btn"
              (click)="
                suggest('Quelles sont les meilleures pratiques pour stocker des mots de passe ?')
              "
            >
              🔒 Stockage mots de passe
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div *ngIf="activeConvId" class="messages-wrap" #messagesContainer>
          <div
            *ngFor="let msg of messages"
            class="msg"
            [ngClass]="msg.role === 'USER' ? 'user' : 'assistant'"
          >
            <div class="msg-avatar">
              <span *ngIf="msg.role === 'USER'">{{ userInitial }}</span>
              <span *ngIf="msg.role === 'ASSISTANT'">🤖</span>
            </div>
            <div>
              <div class="msg-bubble">{{ msg.content }}</div>
              <div class="msg-time">{{ msg.createdAt | date: 'HH:mm' }}</div>
            </div>
          </div>
          <!-- Typing -->
          <div *ngIf="isTyping" class="msg assistant">
            <div class="msg-avatar">🤖</div>
            <div class="typing-bubble">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="input-area">
          <div class="input-row">
            <textarea
              class="msg-input"
              [(ngModel)]="inputText"
              rows="1"
              placeholder="Posez une question sur OWASP ASVS..."
              (keydown)="onKeydown($event)"
              (input)="autoResize($event)"
              [disabled]="isTyping"
            >
            </textarea>
            <button class="btn-send" (click)="send()" [disabled]="!inputText.trim() || isTyping">
              <span *ngIf="!isTyping">➤</span>
              <span
                *ngIf="isTyping"
                class="spinner-border spinner-border-sm"
                style="width:16px;height:16px"
              ></span>
            </button>
          </div>
          <div class="input-hint">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</div>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  activeConvId: string | null = null;
  inputText = '';
  isTyping = false;
  userInitial = 'U';
  private shouldScroll = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userInitial = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  loadConversations(): void {
    this.http.get<any>(`${environment.apiUrl}/chat`).subscribe({
      next: (res) => {
        this.conversations = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  loadConversation(id: string): void {
    this.activeConvId = id;
    this.http.get<any>(`${environment.apiUrl}/chat/${id}/messages`).subscribe({
      next: (res) => {
        this.messages = res.data;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
    });
  }

  newConversation(): void {
    this.http
      .post<any>(`${environment.apiUrl}/chat`, { title: 'Nouvelle conversation' })
      .subscribe({
        next: (res) => {
          this.conversations.unshift(res.data);
          this.activeConvId = res.data.id;
          this.messages = [];
          this.cdr.detectChanges();
        },
      });
  }

  deleteConv(event: Event, id: string): void {
    event.stopPropagation();
    this.http.delete<any>(`${environment.apiUrl}/chat/${id}`).subscribe({
      next: () => {
        this.conversations = this.conversations.filter((c) => c.id !== id);
        if (this.activeConvId === id) {
          this.activeConvId = null;
          this.messages = [];
        }
        this.cdr.detectChanges();
      },
    });
  }

  suggest(text: string): void {
    this.newConversation();
    setTimeout(() => {
      this.inputText = text;
      this.send();
    }, 300);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: any): void {
    const el = event.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  send(): void {
    if (!this.inputText.trim() || this.isTyping) return;
    const content = this.inputText.trim();
    this.inputText = '';

    // Créer conv si besoin
    if (!this.activeConvId) {
      this.http.post<any>(`${environment.apiUrl}/chat`, {}).subscribe({
        next: (res) => {
          this.conversations.unshift(res.data);
          this.activeConvId = res.data.id;
          this.cdr.detectChanges();
          this.sendToConv(content);
        },
      });
    } else {
      this.sendToConv(content);
    }
  }

  sendToConv(content: string): void {
    // Ajouter message user localement
    this.messages.push({
      id: Date.now().toString(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    });
    this.isTyping = true;
    this.shouldScroll = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${environment.apiUrl}/chat/${this.activeConvId}/messages`, { content })
      .subscribe({
        next: (res) => {
          this.messages.push(res.data);
          this.isTyping = false;
          this.shouldScroll = true;
          // Mettre à jour le titre de la conv
          const conv = this.conversations.find((c) => c.id === this.activeConvId);
          if (conv && conv.title === 'Nouvelle conversation') {
            conv.title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.messages.push({
            id: Date.now().toString(),
            role: 'ASSISTANT',
            content: '❌ Erreur de connexion. Vérifiez que le backend est démarré.',
            createdAt: new Date().toISOString(),
          });
          this.isTyping = false;
          this.shouldScroll = true;
          this.cdr.detectChanges();
        },
      });
  }
}
