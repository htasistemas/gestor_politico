import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationData, NotificationService } from '../../modules/shared/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  readonly notification$: Observable<NotificationData | null>;

  readonly typeClassMap: Record<NotificationData['type'], string> = {
    success: 'notification-success',
    error: 'notification-error',
    info: 'notification-info'
  };

  constructor(private readonly notificationService: NotificationService) {
    this.notification$ = this.notificationService.notification$;
  }

  dismiss(): void {
    this.notificationService.dismiss();
  }
}
