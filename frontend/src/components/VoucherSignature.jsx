
import { useEffect, useState } from "react";
import { getVoucherSignature } from "../services/voucherService";

export default function VoucherSignature({
  voucherId,
  kind,
  label
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    setImageUrl("");
    setError("");

    getVoucherSignature(voucherId, kind)
      .then((url) => {
        objectUrl = url;

        if (active) {
          setImageUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (active) {
          setError("Signature not available.");
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [voucherId, kind]);

  return (
    <div className="signature-preview">
      <strong>{label}</strong>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="signature-image"
        />
      ) : (
        <p>{error || "Loading signature..."}</p>
      )}
    </div>
  );
}
