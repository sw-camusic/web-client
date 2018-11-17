import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements AfterViewInit, OnDestroy, OnInit {

  public iAudioCacheDepth: number;
  public iAudioSrcList: string[];

  public iCvHigh: number[];
  public iCvLow: number[];
  public iCvSrc: string;

  public iDebugMode: boolean;

  public iSystemFps: number;
  public iSystemHeight: number;
  public iSystemWidth: number;

  public oCvIsReady: boolean;

  public oDebugFps: number;
  public oDebugLog: string;

  public oSystemHeight: number;
  public oSystemWidth: number;

  @ViewChild("video")
  private eVideo: ElementRef;

  private mAudioCache: HTMLAudioElement[][];

  private mCv: any;
  private mCvAnchor: any;
  private mCvCap: any;
  private mCvHigh: any;
  private mCvLow: any;
  private mCvM: any;
  private mCvMorphologyDefaultBorderValue: any;

  public constructor() {
    this.iAudioCacheDepth = 8;
    this.iAudioSrcList = [
      "/assets/audio/c.mp3",
      "/assets/audio/d.mp3",
      "/assets/audio/e.mp3",
      "/assets/audio/f.mp3",
      "/assets/audio/g.mp3",
      "/assets/audio/a.mp3",
      "/assets/audio/b.mp3",
    ];

    this.iCvHigh = [24, 24, 24, 255];
    this.iCvLow = [0, 0, 0, 0];
    this.iCvSrc = "/assets/opencv.js";

    this.iDebugMode = !environment.production;

    this.iSystemFps = 30;
    this.iSystemHeight = 320;
    this.iSystemWidth = 240;

    this.oCvIsReady = false;

    this.oDebugFps = 0;
    this.oDebugLog = "";

    this.oSystemHeight = 0;
    this.oSystemWidth = 0;
  }

  public ngAfterViewInit(): void {
    this.async(() => {
      this.debugInit();
      this.systemInit();
      this.audioInit();
      this.cvInit();
    });
  }

  public ngOnDestroy(): void {
    this.async(() => {
      this.cvDestroy();
      this.audioDestroy();
      this.systemDestroy();
      this.debugDestroy();
    });
  }

  public ngOnInit(): void {
  }

  private async(fn: () => void): Promise<any> {
    return this.wait(0).then(fn);
  }

  private audioDestroy(): void {
    this.debugLog("audio", "destroy ....");
    this.debugLog("audio", "destroy done");
  }

  private audioInit(): void {
    this.debugLog("audio", "init ....");

    this.audioReCache();

    this.debugLog("audio", "init done");
  }

  private audioPlay(index: number): void {
    if (index < 0 || this.iAudioSrcList.length <= index) {
      return;
    }

    const cache: HTMLAudioElement | undefined = this.mAudioCache[index].shift();
    if (cache !== undefined) {
      cache.play();
    }

    const audio: HTMLElement | null = document.querySelector(`audio[src="${this.iAudioSrcList[index]}"]`);
    if (audio !== null) {
      this.mAudioCache[index].push(<HTMLAudioElement> audio.cloneNode());
    }
  }

  private audioReCache(): void {
    this.mAudioCache = [];
    this.iAudioSrcList.forEach((src: string, index: number) => {
      this.mAudioCache[index] = [];

      const audio: HTMLElement | null = document.querySelector(`audio[src="${src}"]`);
      if (audio !== null) {
        for (let i: number = 0; i < this.iAudioCacheDepth; i++) {
          this.mAudioCache[index].push(<HTMLAudioElement> audio.cloneNode());
        }
      }
    });
  }

  private cvDestroy(): void {
    this.debugLog("cv", "destroy ....");

    this.mCvHigh.delete();
    this.mCvLow.delete();
    this.mCvM.delete();

    this.debugLog("cv", "destroy done");
  }

  private cvInit(): void {
    this.debugLog("cv", "init ....");

    const script: HTMLElement = document.createElement("script");
    script.setAttribute("async", "");
    script.setAttribute("src", this.iCvSrc);
    this.eVideo.nativeElement.parentElement.appendChild(script);

    let cvLoopLast: number = Date.now();
    const cvLoop: () => void = () => {
      const begin: number = Date.now();
      this.cvUpdate();
      this.wait(1000 / this.iSystemFps - (Date.now() - begin)).then(cvLoop);

      this.oDebugFps = Math.round(1000 / (begin - cvLoopLast));
      cvLoopLast = begin;
    };

    const cvWait: () => void = () => {
      if (window["cv"] === undefined
        || window["cv"].Mat === undefined
        || this.eVideo.nativeElement.srcObject === null) {
        this.wait(100).then(cvWait);
      } else {
        this.mCv = window["cv"];
        this.mCvAnchor = new this.mCv.Point(-1, -1);
        this.mCvCap = new this.mCv.VideoCapture(this.eVideo.nativeElement);
        this.mCvHigh = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4, this.iCvHigh);
        this.mCvLow = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4, this.iCvLow);
        this.mCvM = this.mCv.Mat.ones(5, 5, this.mCv.CV_8U);
        this.mCvMorphologyDefaultBorderValue = this.mCv.morphologyDefaultBorderValue();

        this.oCvIsReady = true;

        this.debugLog("cv", "init done");

        this.async(cvLoop);
      }
    };

    this.async(cvWait);
  }

  private cvUpdate(): void {
    const contours: any = new this.mCv.MatVector();
    const dst: any = this.iDebugMode ? new this.mCv.Mat.zeros(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4) : null;
    const dstColor: any = this.iDebugMode ?  new this.mCv.Scalar(255, 255, 255, 255) : null;
    const hierarchy: any = new this.mCv.Mat();
    const src: any = new this.mCv.Mat(this.oSystemHeight, this.oSystemWidth, this.mCv.CV_8UC4);

    this.mCvCap.read(src);

    this.mCv.inRange(src, this.mCvLow, this.mCvHigh, src);
    this.mCv.erode(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.dilate(src, src, this.mCvM, this.mCvAnchor, 1, this.mCv.BORDER_CONSTANT, this.mCvMorphologyDefaultBorderValue);
    this.mCv.findContours(src, contours, hierarchy, this.mCv.RETR_LIST, this.mCv.CHAIN_APPROX_SIMPLE);

    for (let i: number = 0; i < contours.size(); i++) {
      const circle: any = this.mCv.minEnclosingCircle(contours.get(i));

      if (circle.radius > 10 && circle.center.y > this.oSystemHeight / 2) {
        this.audioPlay(Math.round(circle.center.x * this.iAudioSrcList.length / this.oSystemWidth));
      }

      if (this.iDebugMode && circle.radius > 10) {
        this.mCv.circle(dst, circle.center, circle.radius, dstColor);
      }
    }

    if (this.iDebugMode) {
      this.mCv.imshow("canvas", dst);
      dst.delete();
    }

    contours.delete();
    hierarchy.delete();
    src.delete();
  }

  private debugDestroy(): void {
  }

  private debugInit(): void {
  }

  private debugLog(label: string, message: string): void {
    if (this.iDebugMode) {
      this.oDebugLog = new Date().toISOString()
        + " ["
        + (label + "        ").substring(0, 8)
        + "]: "
        + message
        + "<br>"
        + this.oDebugLog;
    }
  }

  private systemDestroy(): void {
    this.debugLog("system", "destroy ....");
    this.debugLog("system", "destroy done");
  }

  private systemInit(): void {
    this.debugLog("system", "init ....");

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment",
        height: this.iSystemHeight,
        width: this.iSystemWidth,
      },
    }).then((stream: MediaStream) => {
      return new Promise((resolve: () => void) => {
        const callback: () => void = () => {
          this.eVideo.nativeElement.removeEventListener("loadedmetadata", callback);
          resolve();
        };

        this.eVideo.nativeElement.addEventListener("loadedmetadata", callback);

        this.eVideo.nativeElement.srcObject = stream;
        this.eVideo.nativeElement.play();
      });
    }).then(() => {
      this.oSystemHeight = this.eVideo.nativeElement.videoHeight;
      this.oSystemWidth = this.eVideo.nativeElement.videoWidth;

      this.debugLog("system", "init done");
    });
  }

  private wait(delay: number): Promise<any> {
    return new Promise((resolve: () => void) => {
      setTimeout(resolve, delay);
    });
  }

}
