import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";
import { AppComponent } from "./components/app/app.component";
import { PartPlayComponent } from "./components/part-play/part-play.component";

@NgModule({
  bootstrap: [
    AppComponent,
  ],
  declarations: [
    AppComponent,
    PartPlayComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: "", component: PartPlayComponent },
    ]),
  ],
  providers: [
  ],
})
export class AppModule {
}
