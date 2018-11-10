import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnInit {

  public debugFpsActual: number;
  public debugLog: string;
  public debugMode: boolean;

  public fps: number;

  public width: number;
  public height: number;

  public isLoading: boolean;

  private isCalledNgAfterViewInit: boolean;
  private isCalledNgOnInit: boolean;
  private isCalledOnLoadedMetaData: boolean;
  private isLoadedOpenCv: boolean;

  private openCv: any;
  private openCvCap: any;
  private openCvDst: any;
  private openCvHigh: any;
  private openCvLow: any;
  private openCvSrc: any;

  @ViewChild("video") private video: ElementRef;

  public constructor() {
  }

  public ngAfterViewInit(): void {
    this.isCalledNgAfterViewInit = true;
  }

  public ngOnInit(): void {
    this.debugFpsActual = 0;
    this.debugLog = "";
    this.debugMode = !environment.production;

    this.isCalledNgAfterViewInit = false;
    this.isCalledNgOnInit = false;
    this.isLoadedOpenCv = false;

    this.init();

    this.isCalledNgOnInit = true;
  }

  public onLoadedMetaData(): void {
    this.isCalledOnLoadedMetaData = true;
  }

  public onOpenCvLoop(): void {
    // this.openCvCap.read(this.openCvSrc);
    // this.openCv.cvtColor(this.openCvSrc, this.openCvDst, this.openCv.COLOR_RGBA2GRAY);
    // this.openCv.imshow("canvas", this.openCvDst);

    // let src = cv.imread('canvasInput');
    // let dst = new cv.Mat();
    // let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
    // let high = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);
    // // You can try more different parameters
    // cv.inRange(src, low, high, dst);
    // cv.imshow('canvasOutput', dst);
    // src.delete(); dst.delete(); low.delete(); high.delete();

    this.openCvCap.read(this.openCvSrc);
    this.openCv.inRange(this.openCvSrc, this.openCvLow, this.openCvHigh, this.openCvDst);
    this.openCv.imshow("canvas", this.openCvDst);
  }

  private init(): void {
    Promise.all([
      this.initOpenCv(),
      this.initUserMedia(),
      this.initVariable(),
      this.initVideo(),
      this.loadOpenCv(),
    ]).then(() => {
      this.log("initialized.");

      this.isLoading = false;

      this.log("start onOpenCvLoop");

      const loop: () => void = () => {
        const begin: number = Date.now();
        this.onOpenCvLoop();
        const end: number = Date.now();

        this.debugFpsActual = Math.round(1000 / (end - begin));
        setTimeout(loop, 1000 / this.fps - (end - begin));
      };

      loop();
    });
  }

  private initOpenCv(): Promise<any> {
    return this.wait(() => {
      return !this.isLoadedOpenCv || !this.isCalledOnLoadedMetaData;
    }).then(() => {
      this.log("initOpenCv: start");

      this.openCv = window["cv"];
      this.openCvCap = new this.openCv.VideoCapture(this.video.nativeElement);
      this.openCvDst = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);
      this.openCvSrc = new this.openCv.Mat(this.height, this.width, this.openCv.CV_8UC4);

      this.openCvLow = new this.openCv.Mat(this.openCvSrc.rows, this.openCvSrc.cols, this.openCvSrc.type(), [0, 0, 0, 0]);
      this.openCvHigh = new this.openCv.Mat(this.openCvSrc.rows, this.openCvSrc.cols, this.openCvSrc.type(), [128, 255, 255, 255]);
    });
  }

  private initUserMedia(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgOnInit;
    }).then(() => {
      this.log("initUserMedia: start");
      this.log("initUserMedia: getUserMedia...");

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          height: 320,
          width: 240,
        },
      }).then((value: MediaStream) => {
        this.log("initUserMedia: getUserMedia... succeed.");

        this.video.nativeElement.srcObject = value;
        this.video.nativeElement.play();
      }).catch(() => {
        this.log("initUserMedia: getUserMedia... failed.");
      });
    });
  }

  private initVariable(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgOnInit;
    }).then(() => {
      this.log("initVariable: start");

      this.fps = 30;
      this.log("initVariable: fps = " + this.fps);
    });
  }

  private initVideo(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledOnLoadedMetaData;
    }).then(() => {
      this.log("initVideo: start");

      this.width = this.video.nativeElement.videoWidth;
      this.height = this.video.nativeElement.videoHeight;

      this.log("initVideo: width = " + this.width);
      this.log("initVideo: height = " + this.height);
    });
  }

  private loadOpenCv(): Promise<any> {
    return this.wait(() => {
      return !this.isCalledNgAfterViewInit;
    }).then(() => {
      this.log("loadOpenCv: start");

      const script: HTMLElement = document.createElement("script");
      script.setAttribute("async", "");
      script.setAttribute("src", "/assets/opencv.js");
      this.video.nativeElement.parentElement.appendChild(script);

      return this.wait(() => {
        return window["cv"] === undefined || window["cv"].Mat === undefined;
      }).then(() => {
        this.log("loadOpenCv: loaded.");
        this.isLoadedOpenCv = true;
      });
    });
  }

  private log(msg: string): void {
    this.debugLog = new Date().toISOString() + " -- " + msg + "<br>" + this.debugLog;
  }

  private wait(until: () => boolean): Promise<any> {
    return new Promise((resolve: () => void) => {
      const loop: () => void = () => {
        if (until()) {
          setTimeout(loop, 1000);
        } else {
          resolve();
        }
      };

      loop();
    });
  }

}
