import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "Lambda360 API",
})
@server("https://example.com", "Main server")
namespace Lambda360;

@route("/hello")
namespace Hello {
  @get
  op sayHello(): string;
}

model FileExists {
  exists: boolean;
  uploadUrl?: string;
  expiresAt?: utcDateTime;
}

@route("/step")
namespace Step {
  @route("/{sha256}")
  @get
  op exists(@path sha256: string): FileExists;
}

namespace Viewer {
  @route("/view")
  @get
  op view(@query sha256: string): {
    @header contentType: "model/gltf-binary";
    @body body: bytes;
  };
}
