"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import ListingDetails from "@/components/listing/ListingDetails";
import ListingLocation from "@/components/listing/ListingLocation";
import ImageUploader from "@/components/upload/ImageUploader";

import { listingService } from "@/services/listing.service";
import {
  listingImageService,
  type ListingImage,
} from "@/services/listing-image.service";

import type { SelectedImage } from "@/hooks/useImageUpload";
import { useAuth } from "@/providers/AuthProvider";

interface City {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ApiListResponse<T> {
  value?: T[];
  Count?: number;
}

interface ListingDraft {
  title: string;
  description: string;
  age: string;
  cityId: string;
  categoryId: string;
  availableNow: boolean;
}

type SubmitAction = "save" | "publish";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const LISTING_DRAFT_KEY = "ubiza_listing_draft";
const LISTING_PENDING_PUBLISH_KEY = "ubiza_listing_pending_publish";

const IMAGE_DATABASE_NAME = "ubiza-listing-drafts";
const IMAGE_DATABASE_VERSION = 1;
const IMAGE_STORE_NAME = "listing-images";
const IMAGE_STORE_KEY = "current-listing-images";

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DATABASE_NAME, IMAGE_DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveDraftImages(files: File[]): Promise<void> {
  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");

    const store = transaction.objectStore(IMAGE_STORE_NAME);

    store.put(files, IMAGE_STORE_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function loadDraftImages(): Promise<File[]> {
  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, "readonly");

    const store = transaction.objectStore(IMAGE_STORE_NAME);

    const request = store.get(IMAGE_STORE_KEY);

    request.onsuccess = () => {
      database.close();

      resolve(Array.isArray(request.result) ? request.result : []);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function clearDraftImages(): Promise<void> {
  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");

    const store = transaction.objectStore(IMAGE_STORE_NAME);

    store.delete(IMAGE_STORE_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function createSelectedImage(file: File): SelectedImage {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    faceBlurRequested: false,
    faceBox: null,
  };
}
export default function ListingForm() {
  const router = useRouter();

  const { isAuthenticated, refreshAuth } = useAuth();

  const automaticPublicationStarted = useRef(false);

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");

  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [availableNow, setAvailableNow] = useState(false);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);

  const [listingId, setListingId] = useState<string | null>(null);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [citiesResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_URL}/cities`, {
            cache: "no-store",
          }),

          fetch(`${API_URL}/categories`, {
            cache: "no-store",
          }),
        ]);

        if (!citiesResponse.ok || !categoriesResponse.ok) {
          throw new Error("Impossible de charger les options.");
        }

        const citiesData: City[] | ApiListResponse<City> =
          await citiesResponse.json();

        const categoriesData: Category[] | ApiListResponse<Category> =
          await categoriesResponse.json();

        setCities(
          Array.isArray(citiesData) ? citiesData : (citiesData.value ?? []),
        );

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : (categoriesData.value ?? []),
        );
      } catch {
        setError("Impossible de charger les données.");
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  useEffect(() => {
    async function loadListing() {
      if (!isAuthenticated) {
        setListingId(null);
        setLoadingListing(false);
        return;
      }

      try {
        const listing = await listingService.getMyListing();

        if (!listing) {
          setListingId(null);
          return;
        }

        setListingId(listing.id);
        setTitle(listing.title);
        setDescription(listing.description);
        setAge(listing.age.toString());
        setCityId(listing.cityId);
        setCategoryId(listing.categoryId);
        setAvailableNow(listing.availableNow);
        setExistingImages(listing.images ?? []);
      } catch {
        setListingId(null);
      } finally {
        setLoadingListing(false);
      }
    }

    void loadListing();
  }, [isAuthenticated]);

  useEffect(() => {
    async function restoreDraft() {
      try {
        const storedDraft = localStorage.getItem(LISTING_DRAFT_KEY);

        if (!storedDraft) {
          return;
        }

        const draft = JSON.parse(storedDraft) as ListingDraft;

        setTitle(draft.title ?? "");
        setDescription(draft.description ?? "");
        setAge(draft.age ?? "");
        setCityId(draft.cityId ?? "");
        setCategoryId(draft.categoryId ?? "");
        setAvailableNow(Boolean(draft.availableNow));

        const storedFiles = await loadDraftImages();

        setImages(storedFiles.map(createSelectedImage));
      } catch {
        setError(
          "Le brouillon a été retrouvé, mais certaines données n’ont pas pu être restaurées.",
        );
      } finally {
        setLoadingDraft(false);
      }
    }

    void restoreDraft();
  }, []);

  const clearTemporaryDraft = useCallback(async () => {
    localStorage.removeItem(LISTING_DRAFT_KEY);
    localStorage.removeItem(LISTING_PENDING_PUBLISH_KEY);

    try {
      await clearDraftImages();
    } catch {
      // La publication est déjà terminée.
      // L’échec du nettoyage local ne doit pas bloquer l’utilisateur.
    }
  }, []);

  const saveTemporaryDraft = useCallback(
    async (
      cleanedTitle: string,
      cleanedDescription: string,
      parsedAge: number,
    ) => {
      const draft: ListingDraft = {
        title: cleanedTitle,
        description: cleanedDescription,
        age: parsedAge.toString(),
        cityId,
        categoryId,
        availableNow,
      };

      localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(draft));

      await saveDraftImages(images.map((image) => image.file));
    },
    [availableNow, categoryId, cityId, images],
  );

  const submitListing = useCallback(
    async (action: SubmitAction) => {
      setError("");
      setSuccess("");

      const cleanedTitle = title.trim();
      const cleanedDescription = description.trim();
      const parsedAge = Number(age);

      if (cleanedTitle.length < 5) {
        setError("Le titre doit contenir au moins 5 caractères.");
        return;
      }

      if (cleanedDescription.length < 20) {
        setError("La description doit contenir au moins 20 caractères.");
        return;
      }

      if (
        !age.trim() ||
        !Number.isInteger(parsedAge) ||
        parsedAge < 18 ||
        parsedAge > 99
      ) {
        setError("L’âge doit être compris entre 18 et 99 ans.");
        return;
      }

      if (!cityId) {
        setError("Sélectionnez une ville.");
        return;
      }

      if (!categoryId) {
        setError("Sélectionnez une catégorie.");
        return;
      }

      if (images.length === 0 && existingImages.length === 0) {
        setError("Ajoutez au moins une photo.");
        return;
      }

      if (!isAuthenticated) {
        if (action !== "publish") {
          setError(
            "Vous devez créer un compte pour enregistrer votre annonce.",
          );
          return;
        }

        try {
          setSubmitting(true);

          await saveTemporaryDraft(cleanedTitle, cleanedDescription, parsedAge);

          localStorage.setItem(LISTING_PENDING_PUBLISH_KEY, "true");

          router.push(
            `/register?next=${encodeURIComponent("/dashboard/listing")}`,
          );
        } catch {
          setError(
            "Impossible de conserver votre brouillon. Veuillez réessayer.",
          );
          setSubmitting(false);
        }

        return;
      }

      try {
        setSubmitting(true);

        let currentListingId = listingId;

        if (listingId) {
          await listingService.updateListing(listingId, {
            title: cleanedTitle,
            description: cleanedDescription,
            age: parsedAge,
            cityId,
            categoryId,
            availableNow,
          });

          currentListingId = listingId;
        } else {
          const listing = await listingService.createListing({
            title: cleanedTitle,
            description: cleanedDescription,
            age: parsedAge,
            cityId,
            categoryId,
            availableNow,
          });

          currentListingId = listing.id;
          setListingId(listing.id);
        }

        if (currentListingId) {
          for (const image of images) {
            await listingImageService.uploadImage(currentListingId, image.file);
          }
        }

        if (action === "publish" && currentListingId) {
          await listingService.publishListing(currentListingId);

          await clearTemporaryDraft();

          await refreshAuth();

          setSuccess("Votre annonce est maintenant publiée.");
        } else {
          setSuccess("Votre annonce a été enregistrée.");
        }

        setImages([]);

        window.setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } catch (err) {
        automaticPublicationStarted.current = false;

        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      age,
      availableNow,
      categoryId,
      cityId,
      clearTemporaryDraft,
      description,
      existingImages.length,
      images,
      isAuthenticated,
      listingId,
      refreshAuth,
      router,
      saveTemporaryDraft,
      title,
    ],
  );

  useEffect(() => {
    const pendingPublication =
      localStorage.getItem(LISTING_PENDING_PUBLISH_KEY) === "true";

    if (
      !pendingPublication ||
      !isAuthenticated ||
      loadingOptions ||
      loadingListing ||
      loadingDraft ||
      automaticPublicationStarted.current
    ) {
      return;
    }

    automaticPublicationStarted.current = true;

    void submitListing("publish");
  }, [
    isAuthenticated,
    loadingDraft,
    loadingListing,
    loadingOptions,
    submitListing,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nativeEvent = event.nativeEvent as SubmitEvent;

    const submitter = nativeEvent.submitter as HTMLButtonElement | null;

    const action = submitter?.value === "publish" ? "publish" : "save";

    await submitListing(action);
  }

  async function handleExistingImageRemove(imageId: string) {
    if (!listingId) {
      setError("Impossible de trouver l’annonce.");
      return;
    }

    try {
      await listingImageService.deleteImage(listingId, imageId);

      setExistingImages((current) =>
        current.filter((image) => image.id !== imageId),
      );
    } catch {
      setError("Impossible de supprimer l’image.");
    }
  }
  async function handleExistingImageSetPrimary(imageId: string) {
    if (!listingId) {
      return;
    }

    try {
      await listingImageService.setPrimaryImage(listingId, imageId);

      setExistingImages((current) =>
        current.map((image) => ({
          ...image,
          isPrimary: image.id === imageId,
        })),
      );
    } catch {
      setError("Impossible de définir cette image comme principale.");
    }
  }

  function handleCancel() {
    if (listingId) {
      router.push("/dashboard");
      return;
    }

    router.push("/");
  }

  if (loadingOptions || loadingListing || loadingDraft) {
    return (
      <div
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
          text-center
          text-zinc-400
        "
      >
        Chargement...
      </div>
    );
  }

  return (
    <>
      {listingId ? (
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm font-medium text-zinc-400 transition hover:text-white"
        >
          ← Retour au dashboard
        </Link>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAuthenticated ? (
          <div
            className="
            rounded-2xl
            border
            border-fuchsia-500/20
            bg-fuchsia-500/10
            p-4
            text-sm
            text-fuchsia-100
          "
          >
            Remplissez librement votre annonce. La création du compte sera
            demandée uniquement lorsque vous cliquerez sur « Publier l’annonce
            ».
          </div>
        ) : null}

        {error ? (
          <div
            className="
            rounded-xl
            bg-red-500/10
            p-4
            text-red-300
          "
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            className="
            rounded-xl
            bg-emerald-500/10
            p-4
            text-emerald-300
          "
          >
            {success}
          </div>
        ) : null}

        <ListingDetails
          title={title}
          description={description}
          age={age}
          availableNow={availableNow}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onAgeChange={setAge}
          onAvailableNowChange={setAvailableNow}
        />

        <ListingLocation
          cities={cities}
          categories={categories}
          cityId={cityId}
          categoryId={categoryId}
          onCityChange={setCityId}
          onCategoryChange={setCategoryId}
        />

        <ImageUploader
          maxImages={10}
          existingImages={existingImages}
          onImagesChange={setImages}
          onExistingImageRemove={handleExistingImageRemove}
          onExistingImageSetPrimary={handleExistingImageSetPrimary}
        />

        <div
          className="
          flex
          flex-col-reverse
          gap-3
          sm:flex-row
          sm:justify-end
        "
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-6
            py-3
            text-white
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          >
            Annuler
          </button>

          {isAuthenticated ? (
            <button
              type="submit"
              name="action"
              value="save"
              disabled={submitting}
              className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-6
              py-3
              font-semibold
              text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            >
              {submitting ? "Traitement..." : "Enregistrer"}
            </button>
          ) : null}

          <button
            type="submit"
            name="action"
            value="publish"
            disabled={submitting}
            className="
            rounded-xl
            bg-gradient-to-r
            from-fuchsia-500
            to-violet-600
            px-6
            py-3
            font-semibold
            text-white
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          >
            {submitting
              ? "Publication..."
              : isAuthenticated
                ? "Publier l’annonce"
                : "Continuer et publier"}
          </button>
        </div>
      </form>
    </>
  );
}

