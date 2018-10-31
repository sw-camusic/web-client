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

  private loop: () => void;
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

    let readyPolling: () => void = () => {
      if (window["cv"] !== undefined && window["cv"].Mat !== undefined) {
        this.isLoading = false;

        this.openCv = window["cv"];
        this.openCvCap = new this.openCv.VideoCapture(this.video.nativeElement);
        this.openCvDst = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);
        this.openCvSrc = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);

        setTimeout(this.loop, 0);
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

    this.loop = () => {
      let begin: number = Date.now();

      this.openCvCap.read(this.openCvSrc);
      this.openCv.cvtColor(this.openCvSrc, this.openCvDst, this.openCv.COLOR_RGBA2GRAY);
      this.openCv.imshow("canvas", this.openCvDst);

      let delay: number = 1000 / this.fps - (Date.now() - begin);
      setTimeout(this.loop, delay);
    };

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

}
