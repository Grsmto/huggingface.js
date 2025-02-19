import { toArray } from "./utils/toArray";
import type { EventSourceMessage } from "./vendor/fetch-event-source/parse";
import { getLines, getMessages } from "./vendor/fetch-event-source/parse";

const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co/models/";

export interface Options {
	/**
	 * (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.
	 */
	retry_on_error?: boolean;
	/**
	 * (Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.
	 */
	use_cache?: boolean;
	/**
	 * (Default: false). Boolean. Do not load the model if it's not already available.
	 */
	dont_load_model?: boolean;
	/**
	 * (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).
	 */
	use_gpu?: boolean;

	/**
	 * (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.
	 */
	wait_for_model?: boolean;

	/**
	 * Custom headers to send with the request.
	 */
	headers?: Record<string, string>;
}

export interface Args {
	/**
	 * The model to use. Optional for endpoints.
	 */
	model?: string;
}

export type FillMaskArgs = Args & {
	inputs: string;
};

export type FillMaskReturn = {
	/**
	 * The probability for this token.
	 */
	score: number;
	/**
	 * The actual sequence of tokens that ran against the model (may contain special tokens)
	 */
	sequence: string;
	/**
	 * The id of the token
	 */
	token: number;
	/**
	 * The string representation of the token
	 */
	token_str: string;
}[];

export type SummarizationArgs = Args & {
	/**
	 * A string to be summarized
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface SummarizationReturn {
	/**
	 * The string after translation
	 */
	summary_text: string;
}

export type QuestionAnswerArgs = Args & {
	inputs: {
		context: string;
		question: string;
	};
};

export interface QuestionAnswerReturn {
	/**
	 * A string that’s the answer within the text.
	 */
	answer: string;
	/**
	 * The index (string wise) of the stop of the answer within context.
	 */
	end: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score: number;
	/**
	 * The index (string wise) of the start of the answer within context.
	 */
	start: number;
}

export type TableQuestionAnswerArgs = Args & {
	inputs: {
		/**
		 * The query in plain text that you want to ask the table
		 */
		query: string;
		/**
		 * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
		 */
		table: Record<string, string[]>;
	};
};

export interface TableQuestionAnswerReturn {
	/**
	 * The aggregator used to get the answer
	 */
	aggregator: string;
	/**
	 * The plaintext answer
	 */
	answer: string;
	/**
	 * A list of coordinates of the cells contents
	 */
	cells: string[];
	/**
	 * a list of coordinates of the cells referenced in the answer
	 */
	coordinates: number[][];
}

export type TextClassificationArgs = Args & {
	/**
	 * A string to be classified
	 */
	inputs: string;
};

export type TextClassificationReturn = {
	/**
	 * The label for the class (model specific)
	 */
	label: string;
	/**
	 * A floats that represents how likely is that the text belongs to this class.
	 */
	score: number;
}[];

export type TextGenerationArgs = Args & {
	/**
	 * A string to be generated from
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
		 */
		do_sample?: boolean;
		/**
		 * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
		 */
		max_new_tokens?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
		 */
		max_time?: number;
		/**
		 * (Default: 1). Integer. The number of proposition you want to be returned.
		 */
		num_return_sequences?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
		 */
		return_full_text?: boolean;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface TextGenerationReturn {
	/**
	 * The continuated string
	 */
	generated_text: string;
}

export interface TextGenerationStreamToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/** Logprob */
	logprob: number;
	/**
	 * Is the token a special token
	 * Can be used to ignore tokens when concatenating
	 */
	special: boolean;
}

export interface TextGenerationStreamPrefillToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/**
	 * Logprob
	 * Optional since the logprob of the first token cannot be computed
	 */
	logprob?: number;
}

export interface TextGenerationStreamBestOfSequence {
	/** Generated text */
	generated_text: string;
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** Generated tokens */
	tokens: TextGenerationStreamToken[];
}

export enum TextGenerationStreamFinishReason {
	/** number of generated tokens == `max_new_tokens` */
	Length = "length",
	/** the model generated its end of sequence token */
	EndOfSequenceToken = "eos_token",
	/** the model generated a text included in `stop_sequences` */
	StopSequence = "stop_sequence",
}

export interface TextGenerationStreamDetails {
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** */
	tokens: TextGenerationStreamToken[];
	/** Additional sequences when using the `best_of` parameter */
	best_of_sequences?: TextGenerationStreamBestOfSequence[];
}

export interface TextGenerationStreamReturn {
	/** Generated token, one at a time */
	token: TextGenerationStreamToken;
	/**
	 * Complete generated text
	 * Only available when the generation is finished
	 */
	generated_text: string | null;
	/**
	 * Generation details
	 * Only available when the generation is finished
	 */
	details: TextGenerationStreamDetails | null;
}

export type TokenClassificationArgs = Args & {
	/**
	 * A string to be classified
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: simple). There are several aggregation strategies:
		 *
		 * none: Every token gets classified without further aggregation.
		 *
		 * simple: Entities are grouped according to the default schema (B-, I- tags get merged when the tag is similar).
		 *
		 * first: Same as the simple strategy except words cannot end up with different tags. Words will use the tag of the first token when there is ambiguity.
		 *
		 * average: Same as the simple strategy except words cannot end up with different tags. Scores are averaged across tokens and then the maximum label is applied.
		 *
		 * max: Same as the simple strategy except words cannot end up with different tags. Word entity will be the token with the maximum score.
		 */
		aggregation_strategy?: "none" | "simple" | "first" | "average" | "max";
	};
};

export interface TokenClassificationReturnValue {
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	end: number;
	/**
	 * The type for the entity being recognized (model specific).
	 */
	entity_group: string;
	/**
	 * How likely the entity was recognized.
	 */
	score: number;
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	start: number;
	/**
	 * The string that was captured
	 */
	word: string;
}

export type TokenClassificationReturn = TokenClassificationReturnValue[];

export type TranslationArgs = Args & {
	/**
	 * A string to be translated
	 */
	inputs: string;
};

export interface TranslationReturn {
	/**
	 * The string after translation
	 */
	translation_text: string;
}

export type ZeroShotClassificationArgs = Args & {
	/**
	 * a string or list of strings
	 */
	inputs: string | string[];
	parameters: {
		/**
		 * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
		 */
		candidate_labels: string[];
		/**
		 * (Default: false) Boolean that is set to True if classes can overlap
		 */
		multi_label?: boolean;
	};
};

export interface ZeroShotClassificationReturnValue {
	labels: string[];
	scores: number[];
	sequence: string;
}

export type ZeroShotClassificationReturn = ZeroShotClassificationReturnValue[];

export type ConversationalArgs = Args & {
	inputs: {
		/**
		 * A list of strings corresponding to the earlier replies from the model.
		 */
		generated_responses?: string[];
		/**
		 * A list of strings corresponding to the earlier replies from the user. Should be of the same length of generated_responses.
		 */
		past_user_inputs?: string[];
		/**
		 * The last input from the user in the conversation.
		 */
		text: string;
	};
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface ConversationalReturn {
	conversation: {
		generated_responses: string[];
		past_user_inputs: string[];
	};
	generated_text: string;
	warnings: string[];
}
export type FeatureExtractionArgs = Args & {
	/**
	 *  The inputs is a string or a list of strings to get the features from.
	 *
	 *  inputs: "That is a happy person",
	 *
	 */
	inputs: string | string[];
};

/**
 * Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
 */
export type FeatureExtractionReturn = (number | number[])[];

export type SentenceSimiliarityArgs = Args & {
	/**
	 * The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will look like this:
	 *
	 *  inputs: &#123;
	 *    "source_sentence": "That is a happy person",
	 *    "sentences": ["That is a happy dog", "That is a very happy person", "Today is a sunny day"]
	 *  &#125;
	 */
	inputs: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Returned values are a list of floats
 */
export type SentenceSimiliarityReturn = number[];

export type ImageClassificationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageClassificationReturnValue {
	/**
	 * A float that represents how likely it is that the image file belongs to this class.
	 */
	label: string;
	/**
	 * The label for the class (model specific)
	 */
	score: number;
}

export type ImageClassificationReturn = ImageClassificationReturnValue[];

export type ObjectDetectionArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ObjectDetectionReturnValue {
	/**
	 * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
	 */
	box: {
		xmax: number;
		xmin: number;
		ymax: number;
		ymin: number;
	};
	/**
	 * The label for the class (model specific) of a detected object.
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ObjectDetectionReturn = ObjectDetectionReturnValue[];

export type ImageSegmentationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageSegmentationReturnValue {
	/**
	 * The label for the class (model specific) of a segment.
	 */
	label: string;
	/**
	 * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
	 */
	mask: string;
	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ImageSegmentationReturn = ImageSegmentationReturnValue[];

export type AutomaticSpeechRecognitionArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AutomaticSpeechRecognitionReturn {
	/**
	 * The text that was recognized from the audio
	 */
	text: string;
}

export type AudioClassificationArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AudioClassificationReturnValue {
	/**
	 * The label for the class (model specific)
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the audio file belongs to this class.
	 */
	score: number;
}

export type AudioClassificationReturn = AudioClassificationReturnValue[];

export type TextToImageArgs = Args & {
	/**
	 * The text to generate an image from
	 */
	inputs: string;

	parameters?: {
		/**
		 * An optional negative prompt for the image generation
		 */
		negative_prompt?: string;
		/**
		 * The height in pixels of the generated image
		 */
		height?: number;
		/**
		 * The width in pixels of the generated image
		 */
		width?: number;
		/**
		 * The number of denoising steps. More denoising steps usually lead to a higher quality image at the expense of slower inference.
		 */
		num_inference_steps?: number;
		/**
		 * Guidance scale: Higher guidance scale encourages to generate images that are closely linked to the text `prompt`, usually at the expense of lower image quality.
		 */
		guidance_scale?: number;
	};
};

export type TextToImageReturn = Blob;

export type ImageToTextArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageToTextReturn {
	/**
	 * The generated caption
	 */
	generated_text: string;
}

export class HfInference {
	private readonly apiKey: string;
	private readonly defaultOptions: Options;
	private readonly endpointUrl?: string;

	constructor(apiKey = "", defaultOptions: Options = {}, endpointUrl?: string) {
		this.apiKey = apiKey;
		this.defaultOptions = defaultOptions;
		this.endpointUrl = endpointUrl;
	}

	/**
	 * Returns copy of HfInference tied to a specified endpoint.
	 */
	public endpoint(endpointUrl: string): HfInference {
		return new HfInference(this.apiKey, this.defaultOptions, endpointUrl);
	}

	/**
	 * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
	 */
	public async fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskReturn> {
		const res = await this.request<FillMaskReturn>(args, options);
		const isValidOutput =
			Array.isArray(res) &&
			res.every(
				(x) =>
					typeof x.score === "number" &&
					typeof x.sequence === "string" &&
					typeof x.token === "number" &&
					typeof x.token_str === "string"
			);
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type Array<score: number, sequence:string, token:number, token_str:string>"
			);
		}
		return res;
	}

	/**
	 * This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.
	 */
	public async summarization(args: SummarizationArgs, options?: Options): Promise<SummarizationReturn> {
		const res = await this.request<SummarizationReturn[]>(args, options);
		const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.summary_text === "string");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<summary_text: string>");
		}
		return res?.[0];
	}

	/**
	 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
	 */
	public async questionAnswer(args: QuestionAnswerArgs, options?: Options): Promise<QuestionAnswerReturn> {
		const res = await this.request<QuestionAnswerReturn>(args, options);
		const isValidOutput =
			typeof res.answer === "string" &&
			typeof res.end === "number" &&
			typeof res.score === "number" &&
			typeof res.start === "number";
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type <answer: string, end: number, score: number, start: number>"
			);
		}
		return res;
	}

	/**
	 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
	 */
	public async tableQuestionAnswer(
		args: TableQuestionAnswerArgs,
		options?: Options
	): Promise<TableQuestionAnswerReturn> {
		const res = await this.request<TableQuestionAnswerReturn>(args, options);
		const isValidOutput =
			typeof res.aggregator === "string" &&
			typeof res.answer === "string" &&
			Array.isArray(res.cells) &&
			res.cells.every((x) => typeof x === "string") &&
			Array.isArray(res.coordinates) &&
			res.coordinates.every((coord) => Array.isArray(coord) && coord.every((x) => typeof x === "number"));
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type <aggregator: string, answer: string, cells: string[], coordinates: number[][]>"
			);
		}
		return res;
	}

	/**
	 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
	 */
	public async textClassification(args: TextClassificationArgs, options?: Options): Promise<TextClassificationReturn> {
		const res = (await this.request<TextClassificationReturn[]>(args, options))?.[0];
		const isValidOutput =
			Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
		}
		return res;
	}

	/**
	 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
	 */
	public async textGeneration(args: TextGenerationArgs, options?: Options): Promise<TextGenerationReturn> {
		const res = await this.request<TextGenerationReturn[]>(args, options);
		const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.generated_text === "string");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<generated_text: string>");
		}
		return res?.[0];
	}

	/**
	 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
	 */
	public async *textGenerationStream(
		args: TextGenerationArgs,
		options?: Options
	): AsyncGenerator<TextGenerationStreamReturn> {
		yield* this.streamingRequest<TextGenerationStreamReturn>(args, options);
	}

	/**
	 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
	 */
	public async tokenClassification(
		args: TokenClassificationArgs,
		options?: Options
	): Promise<TokenClassificationReturn> {
		const res = toArray(await this.request<TokenClassificationReturnValue | TokenClassificationReturn>(args, options));
		const isValidOutput =
			Array.isArray(res) &&
			res.every(
				(x) =>
					typeof x.end === "number" &&
					typeof x.entity_group === "string" &&
					typeof x.score === "number" &&
					typeof x.start === "number" &&
					typeof x.word === "string"
			);
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type Array<end: number, entity_group: string, score: number, start: number, word: string>"
			);
		}
		return res;
	}

	/**
	 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
	 */
	public async translation(args: TranslationArgs, options?: Options): Promise<TranslationReturn> {
		const res = await this.request<TranslationReturn[]>(args, options);
		const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.translation_text === "string");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<translation_text: string>");
		}
		return res?.[0];
	}

	/**
	 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
	 */
	public async zeroShotClassification(
		args: ZeroShotClassificationArgs,
		options?: Options
	): Promise<ZeroShotClassificationReturn> {
		const res = toArray(
			await this.request<ZeroShotClassificationReturnValue | ZeroShotClassificationReturn>(args, options)
		);
		const isValidOutput =
			Array.isArray(res) &&
			res.every(
				(x) =>
					Array.isArray(x.labels) &&
					x.labels.every((_label) => typeof _label === "string") &&
					Array.isArray(x.scores) &&
					x.scores.every((_score) => typeof _score === "number") &&
					typeof x.sequence === "string"
			);
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type Array<labels: string[], scores: number[], sequence: string>"
			);
		}
		return res;
	}

	/**
	 * This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.
	 *
	 */
	public async conversational(args: ConversationalArgs, options?: Options): Promise<ConversationalReturn> {
		const res = await this.request<ConversationalReturn>(args, options);
		const isValidOutput =
			Array.isArray(res.conversation.generated_responses) &&
			res.conversation.generated_responses.every((x) => typeof x === "string") &&
			Array.isArray(res.conversation.past_user_inputs) &&
			res.conversation.past_user_inputs.every((x) => typeof x === "string") &&
			typeof res.generated_text === "string" &&
			Array.isArray(res.warnings) &&
			res.warnings.every((x) => typeof x === "string");
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type <conversation: {generated_responses: string[], past_user_inputs: string[]}, generated_text: string, warnings: string[]>"
			);
		}
		return res;
	}

	/**
	 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
	 */
	public async featureExtraction(args: FeatureExtractionArgs, options?: Options): Promise<FeatureExtractionReturn> {
		const res = await this.request<FeatureExtractionReturn>(args, options);
		let isValidOutput = true;
		// Check if output is an array
		if (Array.isArray(res)) {
			for (const e of res) {
				// Check if output is an array of arrays or numbers
				if (Array.isArray(e)) {
					// if all elements are numbers, continue
					isValidOutput = e.every((x) => typeof x === "number");
					if (!isValidOutput) {
						break;
					}
				} else if (typeof e !== "number") {
					isValidOutput = false;
					break;
				}
			}
		} else {
			isValidOutput = false;
		}
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<Array<number> | number>");
		}
		return res;
	}

	/**
	 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
	 */
	public async sentenceSimiliarity(
		args: SentenceSimiliarityArgs,
		options?: Options
	): Promise<SentenceSimiliarityReturn> {
		const res = await this.request<SentenceSimiliarityReturn>(args, options);

		const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<number>");
		}
		return res;
	}

	/**
	 * This task reads some audio input and outputs the said words within the audio files.
	 * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
	 */
	public async automaticSpeechRecognition(
		args: AutomaticSpeechRecognitionArgs,
		options?: Options
	): Promise<AutomaticSpeechRecognitionReturn> {
		const res = await this.request<AutomaticSpeechRecognitionReturn>(args, {
			...options,
			binary: true,
		});
		const isValidOutput = typeof res.text === "string";
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type <text: string>");
		}
		return res;
	}

	/**
	 * This task reads some audio input and outputs the likelihood of classes.
	 * Recommended model:  superb/hubert-large-superb-er
	 */
	public async audioClassification(
		args: AudioClassificationArgs,
		options?: Options
	): Promise<AudioClassificationReturn> {
		const res = await this.request<AudioClassificationReturn>(args, {
			...options,
			binary: true,
		});
		const isValidOutput =
			Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
		}
		return res;
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes.
	 * Recommended model: google/vit-base-patch16-224
	 */
	public async imageClassification(
		args: ImageClassificationArgs,
		options?: Options
	): Promise<ImageClassificationReturn> {
		const res = await this.request<ImageClassificationReturn>(args, {
			...options,
			binary: true,
		});
		const isValidOutput =
			Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
		}
		return res;
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
	 * Recommended model: facebook/detr-resnet-50
	 */
	public async objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionReturn> {
		const res = await this.request<ObjectDetectionReturn>(args, {
			...options,
			binary: true,
		});
		const isValidOutput =
			Array.isArray(res) &&
			res.every(
				(x) =>
					typeof x.label === "string" &&
					typeof x.score === "number" &&
					typeof x.box.xmin === "number" &&
					typeof x.box.ymin === "number" &&
					typeof x.box.xmax === "number" &&
					typeof x.box.ymax === "number"
			);
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
			);
		}
		return res;
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
	 * Recommended model: facebook/detr-resnet-50-panoptic
	 */
	public async imageSegmentation(args: ImageSegmentationArgs, options?: Options): Promise<ImageSegmentationReturn> {
		const res = await this.request<ImageSegmentationReturn>(args, {
			...options,
			binary: true,
		});
		const isValidOutput =
			Array.isArray(res) &&
			res.every((x) => typeof x.label === "string" && typeof x.mask === "string" && typeof x.score === "number");
		if (!isValidOutput) {
			throw new TypeError(
				"Invalid inference output: output must be of type Array<label: string, mask: string, score: number>"
			);
		}
		return res;
	}

	/**
	 * This task reads some text input and outputs an image.
	 * Recommended model: stabilityai/stable-diffusion-2
	 */
	public async textToImage(args: TextToImageArgs, options?: Options): Promise<TextToImageReturn> {
		const res = await this.request<TextToImageReturn>(args, {
			...options,
			blob: true,
		});
		const isValidOutput = res && res instanceof Blob;
		if (!isValidOutput) {
			throw new TypeError("Invalid inference output: output must be of type object & of instance Blob");
		}
		return res;
	}

	/**
	 * This task reads some image input and outputs the text caption.
	 */
	public async imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextReturn> {
		return (
			await this.request<[ImageToTextReturn]>(args, {
				...options,
				binary: true,
			})
		)?.[0];
	}

	/**
	 * Helper that prepares request arguments
	 */
	private makeRequestOptions(
		args: Args & {
			data?: Blob | ArrayBuffer;
			stream?: boolean;
		},
		options?: Options & {
			binary?: boolean;
			blob?: boolean;
			/** For internal HF use, which is why it's not exposed in {@link Options} */
			includeCredentials?: boolean;
		}
	) {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const { model, ...otherArgs } = args;

		let headers: Record<string, string> = {};

		if (this.apiKey) {
			headers["Authorization"] = `Bearer ${this.apiKey}`;
		}

		if (!options?.binary) {
			headers["Content-Type"] = "application/json";
		}

		if (options?.binary) {
			if (mergedOptions.wait_for_model) {
				headers["X-Wait-For-Model"] = "true";
			}
			if (mergedOptions.use_cache === false) {
				headers["X-Use-Cache"] = "false";
			}
			if (mergedOptions.dont_load_model) {
				headers["X-Load-Model"] = "0";
			}
		}

		headers = { ...headers, ...this.defaultOptions?.headers };

		if (!model && !this.endpointUrl) {
			throw new Error("Model is required for Inference API");
		}
		const url = this.endpointUrl ? this.endpointUrl : `${HF_INFERENCE_API_BASE_URL}${model}`;
		const info: RequestInit = {
			headers,
			method: "POST",
			body: options?.binary
				? args.data
				: JSON.stringify({
						...otherArgs,
						options: mergedOptions,
				  }),
			credentials: options?.includeCredentials ? "include" : "same-origin",
		};

		return { url, info, mergedOptions };
	}

	public async request<T>(
		args: Args & { data?: Blob | ArrayBuffer },
		options?: Options & {
			binary?: boolean;
			blob?: boolean;
			/** For internal HF use, which is why it's not exposed in {@link Options} */
			includeCredentials?: boolean;
		}
	): Promise<T> {
		const { url, info, mergedOptions } = this.makeRequestOptions(args, options);
		const response = await fetch(url, info);

		if (mergedOptions.retry_on_error !== false && response.status === 503 && !mergedOptions.wait_for_model) {
			return this.request(args, {
				...mergedOptions,
				wait_for_model: true,
			});
		}

		if (options?.blob) {
			if (!response.ok) {
				if (response.headers.get("Content-Type")?.startsWith("application/json")) {
					const output = await response.json();
					if (output.error) {
						throw new Error(output.error);
					}
				}
				throw new Error("An error occurred while fetching the blob");
			}
			return (await response.blob()) as T;
		}

		const output = await response.json();
		if (output.error) {
			throw new Error(output.error);
		}
		return output;
	}

	/**
	 * Make request that uses server-sent events and returns response as a generator
	 */
	public async *streamingRequest<T>(
		args: Args & { data?: Blob | ArrayBuffer },
		options?: Options & {
			binary?: boolean;
			blob?: boolean;
			/** For internal HF use, which is why it's not exposed in {@link Options} */
			includeCredentials?: boolean;
		}
	): AsyncGenerator<T> {
		const { url, info, mergedOptions } = this.makeRequestOptions({ ...args, stream: true }, options);
		const response = await fetch(url, info);

		if (mergedOptions.retry_on_error !== false && response.status === 503 && !mergedOptions.wait_for_model) {
			return this.streamingRequest(args, {
				...mergedOptions,
				wait_for_model: true,
			});
		}
		if (!response.ok) {
			if (response.headers.get("Content-Type")?.startsWith("application/json")) {
				const output = await response.json();
				if (output.error) {
					throw new Error(output.error);
				}
			}

			throw new Error(`Server response contains error: ${response.status}`);
		}
		if (response.headers.get("content-type") !== "text/event-stream") {
			throw new Error(
				`Server does not support event stream content type, it returned ` + response.headers.get("content-type")
			);
		}

		if (!response.body) {
			return;
		}

		const reader = response.body.getReader();
		let events: EventSourceMessage[] = [];

		const onEvent = (event: EventSourceMessage) => {
			// accumulate events in array
			events.push(event);
		};

		const onChunk = getLines(
			getMessages(
				() => {},
				() => {},
				onEvent
			)
		);

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) return;
				onChunk(value);
				for (const event of events) {
					if (event.data.length > 0) {
						yield JSON.parse(event.data) as T;
					}
				}
				events = [];
			}
		} finally {
			reader.releaseLock();
		}
	}
}
