import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

type NotificationType = 'success' | 'error' | 'info';

export interface NotificationData {
  type: NotificationType;
  title: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationSubject = new BehaviorSubject<NotificationData | null>(null);
  private dismissalTimeout: ReturnType<typeof setTimeout> | null = null;

  get notification$(): Observable<NotificationData | null> {
    return this.notificationSubject.asObservable();
  }

  showSuccess(title: string, message?: string, durationMs = 6000): void {
    this.show({ type: 'success', title, message }, durationMs);
  }

  showError(title: string, message?: string, durationMs = 6000): void {
    this.show({ type: 'error', title, message }, durationMs);
  }

  showInfo(title: string, message?: string, durationMs = 6000): void {
    this.show({ type: 'info', title, message }, durationMs);
  }

  dismiss(): void {
    if (this.dismissalTimeout) {
      clearTimeout(this.dismissalTimeout);
      this.dismissalTimeout = null;
    }
    this.notificationSubject.next(null);
  }

  private show(notification: NotificationData, durationMs: number): void {
    if (this.dismissalTimeout) {
      clearTimeout(this.dismissalTimeout);
    }

    this.notificationSubject.next(notification);

    if (durationMs > 0) {
      this.dismissalTimeout = setTimeout(() => this.dismiss(), durationMs);
    }
  }
}
