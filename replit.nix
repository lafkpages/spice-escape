{ pkgs }: {
  deps = [
    pkgs.nodejs-16_x
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.prettier
    pkgs.nodePackages.yarn
    pkgs.replitPackages.jest
  ];
}