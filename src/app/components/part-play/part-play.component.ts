import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";

@Component({
  selector: "app-part-play",
  styleUrls: ["./part-play.component.css"],
  templateUrl: "./part-play.component.html",
})
export class PartPlayComponent implements OnInit {

  public mediaStream: MediaStream;
  public videoHeight: number;
  public videoWidth: number;

  @ViewChild("video") private video: ElementRef;

  public constructor() {
  }

  public ngOnInit(): void {
    this.videoHeight = Math.floor(window.innerHeight * 0.9);
    this.videoWidth = Math.floor(window.innerWidth * 0.9);

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment",
      },
    }).then((value: MediaStream) => {
      this.mediaStream = value;
      this.video.nativeElement.srcObject = value;
    });
  }

}
