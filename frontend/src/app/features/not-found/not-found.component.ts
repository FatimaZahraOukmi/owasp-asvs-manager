import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .shell {
        min-height: 100vh;
        background: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Syne', sans-serif;
        overflow: hidden;
        position: relative;
      }

      /* Grille de fond animée */
      .grid-bg {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(59, 130, 246, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.06) 1px, transparent 1px);
        background-size: 40px 40px;
        animation: gridMove 20s linear infinite;
      }
      @keyframes gridMove {
        0% {
          transform: translate(0, 0);
        }
        100% {
          transform: translate(40px, 40px);
        }
      }

      /* Cercles décoratifs */
      .blob1 {
        position: absolute;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
        top: -100px;
        left: -100px;
        animation: pulse 6s ease-in-out infinite;
      }
      .blob2 {
        position: absolute;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
        bottom: -80px;
        right: -80px;
        animation: pulse 8s ease-in-out infinite reverse;
      }
      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.1);
          opacity: 1;
        }
      }

      .content {
        position: relative;
        z-index: 10;
        text-align: center;
        padding: 40px 20px;
        max-width: 600px;
      }

      /* 404 géant */
      .big-404 {
        font-family: 'Space Mono', monospace;
        font-size: clamp(100px, 20vw, 180px);
        font-weight: 700;
        line-height: 1;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        position: relative;
        animation: glitch 4s ease-in-out infinite;
        letter-spacing: -4px;
      }

      /* Effet glitch */
      .big-404::before,
      .big-404::after {
        content: '404';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .big-404::before {
        animation: glitchTop 4s ease-in-out infinite;
        clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
        left: 2px;
        opacity: 0.6;
      }
      .big-404::after {
        animation: glitchBot 4s ease-in-out infinite;
        clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
        left: -2px;
        opacity: 0.6;
      }

      @keyframes glitch {
        0%,
        90%,
        100% {
          transform: translate(0);
        }
        91% {
          transform: translate(-2px, 1px);
        }
        93% {
          transform: translate(2px, -1px);
        }
        95% {
          transform: translate(-1px, 2px);
        }
        97% {
          transform: translate(1px, -2px);
        }
      }
      @keyframes glitchTop {
        0%,
        90%,
        100% {
          transform: translate(0);
          filter: hue-rotate(0deg);
        }
        91% {
          transform: translate(-3px, 0);
          filter: hue-rotate(90deg);
        }
        93% {
          transform: translate(3px, 0);
          filter: hue-rotate(180deg);
        }
        95% {
          transform: translate(0);
        }
      }
      @keyframes glitchBot {
        0%,
        90%,
        100% {
          transform: translate(0);
          filter: hue-rotate(0deg);
        }
        92% {
          transform: translate(3px, 0);
          filter: hue-rotate(-90deg);
        }
        94% {
          transform: translate(-3px, 0);
          filter: hue-rotate(60deg);
        }
        96% {
          transform: translate(0);
        }
      }

      /* Badge OWASP */
      .owasp-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 30px;
        padding: 6px 16px;
        margin-bottom: 20px;
        animation: fadeDown 0.6s ease both;
      }
      .owasp-badge span {
        font-family: 'Space Mono', monospace;
        font-size: 0.72rem;
        color: #60a5fa;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .title {
        font-size: clamp(1.4rem, 4vw, 2rem);
        font-weight: 800;
        color: #f1f5f9;
        margin-bottom: 12px;
        animation: fadeDown 0.6s 0.1s ease both;
      }

      .subtitle {
        font-family: 'Space Mono', monospace;
        font-size: 0.85rem;
        color: #64748b;
        line-height: 1.7;
        margin-bottom: 36px;
        animation: fadeDown 0.6s 0.2s ease both;
      }

      .subtitle .code {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        padding: 1px 6px;
        border-radius: 4px;
      }

      /* Boutons */
      .btns {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        animation: fadeDown 0.6s 0.3s ease both;
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 13px 24px;
        font-family: 'Syne', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
      }

      .btn-secondary {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 13px 24px;
        font-family: 'Syne', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
        border-color: rgba(255, 255, 255, 0.2);
      }

      /* Ligne déco */
      .deco-line {
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #6366f1);
        border-radius: 2px;
        margin: 24px auto;
        animation: expandLine 0.8s 0.4s ease both;
      }
      @keyframes expandLine {
        from {
          width: 0;
          opacity: 0;
        }
        to {
          width: 60px;
          opacity: 1;
        }
      }

      /* Terminal déco */
      .terminal {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 8px 16px;
        margin-bottom: 32px;
        animation: fadeDown 0.6s 0.15s ease both;
      }
      .terminal-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .terminal-text {
        font-family: 'Space Mono', monospace;
        font-size: 0.75rem;
        color: #475569;
      }
      .terminal-text .cmd {
        color: #10b981;
      }
      .cursor {
        display: inline-block;
        width: 8px;
        height: 14px;
        background: #3b82f6;
        margin-left: 2px;
        animation: blink 0.8s step-end infinite;
        vertical-align: middle;
      }
      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
      }

      @keyframes fadeDown {
        from {
          opacity: 0;
          transform: translateY(-16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>

    <div class="shell">
      <div class="grid-bg"></div>
      <div class="blob1"></div>
      <div class="blob2"></div>

      <div class="content">
        <div class="owasp-badge">
          <span>🔒</span>
          <span>OWASP ASVS Manager</span>
        </div>

        <div class="big-404">404</div>

        <div class="deco-line"></div>

        <div class="title">Page introuvable</div>

        <div class="terminal">
          <div class="terminal-dot" style="background:#ef4444"></div>
          <div class="terminal-dot" style="background:#f59e0b"></div>
          <div class="terminal-dot" style="background:#10b981"></div>
          <div class="terminal-text">
            <span class="cmd">GET</span> {{ currentUrl }} →
            <span style="color:#ef4444">404 Not Found</span><span class="cursor"></span>
          </div>
        </div>

        <div class="subtitle">
          La route <span class="code">{{ currentUrl }}</span> n'existe pas.<br />
          Vous avez peut-être suivi un lien invalide ou tapé une mauvaise URL.
        </div>

        <div class="btns">
          <button class="btn-primary" (click)="goHome()">🏠 Retour au dashboard</button>
          <button class="btn-secondary" (click)="goBack()">← Page précédente</button>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  currentUrl = window.location.pathname;

  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}
