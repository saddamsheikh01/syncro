declare namespace google {
  namespace accounts {
    namespace id {
      type ButtonTheme = "outline" | "filled_blue" | "filled_black";
      type ButtonSize = "large" | "medium" | "small";
      type ButtonText = "signin_with" | "signup_with" | "continue_with" | "signin";
      type ButtonShape = "rectangular" | "pill" | "circle" | "square";

      interface CredentialResponse {
        credential?: string;
        select_by?: string;
      }

      interface IdConfiguration {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }

      interface GsiButtonConfiguration {
        type?: "standard" | "icon";
        theme?: ButtonTheme;
        size?: ButtonSize;
        text?: ButtonText;
        shape?: ButtonShape;
        logo_alignment?: "left" | "center";
        width?: number | string;
      }

      function initialize(config: IdConfiguration): void;
      function renderButton(
        parent: HTMLElement,
        options: GsiButtonConfiguration
      ): void;
      function prompt(momentListener?: (notification: unknown) => void): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
