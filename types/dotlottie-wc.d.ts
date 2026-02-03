declare namespace JSX {
  interface IntrinsicElements {
    'dotlottie-wc': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: boolean;
        loop?: boolean;
      },
      HTMLElement
    >;
  }
}
