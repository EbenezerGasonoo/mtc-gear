<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MtcGearAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $subjectText;
    public string $event;
    public string $title;
    public string $bodyMessage;
    public array $meta;
    public ?string $link;

    public function __construct(
        string $event,
        string $title,
        string $bodyMessage,
        array $meta = [],
        ?string $link = null
    ) {
        $this->event = $event;
        $this->title = $title;
        $this->bodyMessage = $bodyMessage;
        $this->meta = $meta;
        $this->link = $link;
        $this->subjectText = "⛰️ [MTC GEAR] " . $title;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.alert',
            with: [
                'event' => $this->event,
                'title' => $this->title,
                'bodyMessage' => $this->bodyMessage,
                'meta' => $this->meta,
                'link' => $this->link,
            ]
        );
    }
}
