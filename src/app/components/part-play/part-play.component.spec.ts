import { ComponentFixture, TestBed, async } from "@angular/core/testing";
import { PartPlayComponent } from "./part-play.component";

describe("PartPlayComponent", () => {
  let component: PartPlayComponent;
  let fixture: ComponentFixture<PartPlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PartPlayComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartPlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
