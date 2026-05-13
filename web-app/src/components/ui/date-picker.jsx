"use client";

import { Input } from "@/components/ui/input";

function DatePicker(props) {
  return <Input nativeInput type="date" {...props} />;
}

export { DatePicker };
