import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app/app.component.js';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(CommonModule)
  ]
}).catch(err => console.error(err));