import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component.js';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(CommonModule, FormsModule)
  ]
}).catch(err => console.error(err));