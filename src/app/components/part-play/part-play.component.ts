import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnInit {

  public fps: number;
  public height: number;
  public isLoading: boolean;
  public width: number;

  private openCv: any;
  private openCvCap: any;
  private openCvDst: any;
  private openCvSrc: any;
  @ViewChild("video") private video: ElementRef;

  public constructor() {
  }

  public ngAfterViewInit(): void {
    const script: HTMLElement = document.createElement("script");
    script.setAttribute("async", "");
    script.setAttribute("src", "/assets/opencv.js");
    this.video.nativeElement.parentElement.appendChild(script);

    let loop: () => void = () => {
      let begin: number = Date.now();
      this.onOpenCvLoop();
      setTimeout(loop, 1000 / this.fps - (Date.now() - begin));
    };

    let readyPolling: () => void = () => {
      if (window["cv"] !== undefined && window["cv"].Mat !== undefined) {
        this.isLoading = false;
        this.onOpenCvInit();
        setTimeout(loop, 0);
      } else {
        setTimeout(readyPolling, 1000);
      }
    };

    readyPolling();
  }

  public ngOnInit(): void {
    this.fps = 30;
    this.height = Math.floor(window.innerHeight * 0.9);
    this.isLoading = true;
    this.width = Math.floor(window.innerWidth * 0.9);

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment",
      },
    }).then((value: MediaStream) => {
      this.video.nativeElement.srcObject = value;
      this.video.nativeElement.play();
    });
  }

  public onOpenCvInit(): void {
    this.openCv = window["cv"];
    this.openCvCap = new this.openCv.VideoCapture(this.video.nativeElement);
    this.openCvDst = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);
    this.openCvSrc = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);
  }

  public onOpenCvLoop(): void {
    this.openCvCap.read(this.openCvSrc);
    this.openCv.cvtColor(this.openCvSrc, this.openCvDst, this.openCv.COLOR_RGBA2GRAY);
    this.openCv.imshow("canvas", this.openCvDst);
  }

}
