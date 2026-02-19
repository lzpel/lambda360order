import { getDiscriminator } from "@typespec/compiler";

export function $discriminatorDefault(context, target, value) {
	const discriminator = getDiscriminator(context.program, target);
	if (discriminator) {
		if (value.kind === "String") {
			discriminator["x-default"] = value.value;
		} else {
			discriminator["x-default"] = value;
		}
	}
}
